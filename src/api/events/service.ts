import * as gc from '@/common/utils/google-calendar';
import { buildEventDateTimeInfo } from '@/common/utils/handle-tana-date';
import {
	EventData,
	EventFieldsToReturn,
	EventOptions,
	PartialEventData,
} from './schemas';
import { DEFAULT_OPTIONS } from './constants';

/**
 * Converts a Google Calendar event into Tana Paste format string.
 * Each field is formatted as "field::value" with newlines between multiple fields.
 *
 * @param event - The Google Calendar event object containing event details
 * @param calendarId - The calendar ID where the event resides
 * @param fieldsToReturn - Array of field configurations specifying which properties to include:
 *   - `field` (string): The display name for the field in Tana
 *   - `property` (string): The corresponding property name from the event object (use "calendarId" for calendar ID)
 *
 * @returns Tana Paste formatted string with each field as "field::value"
 */
function buildTanaPaste(
	event: gc.CalendarEvent,
	calendarId: string,
	fieldsToReturn: EventFieldsToReturn
): string {
	return fieldsToReturn.reduce((acc, { field, property }, index) => {
		const value =
			property === 'calendarId'
				? calendarId
				: event[property as keyof typeof event];
		if (value) {
			acc += `${field}::${value}${
				fieldsToReturn.length > 1 && index !== fieldsToReturn.length - 1
					? '\n'
					: ''
			}`;
		}
		return acc;
	}, '');
}

/**
 * Builds an event summary by combining name with optional prefix and suffix.
 *
 * @param name - The base event name/title
 * @param options - Configuration object for title formatting:
 *   - `prefix` (string): *Optional*. Text to add before the event name
 *   - `suffix` (string): *Optional*. Text to add after the event name
 *
 * @returns The formatted event title with prefix and suffix applied
 */
function buildSummary(
	name: string,
	options: { prefix?: string; suffix?: string } = {}
): string {
	const { prefix = '', suffix = '' } = options;
	return `${prefix}${name}${suffix}`.trim();
}

/**
 * Creates a new event in the specified Google Calendar and returns event information
 * formatted as Tana Paste content for seamless import into Tana.
 *
 * @param accessToken - The Google Calendar client access token
 * @param calendarId - The Google Calendar ID where the event will be created
 * @param data - Event data object with the following properties:
 *   - `name` (string): Event title/summary (min 1 char, trimmed).
 *   - `date` (TanaDateInfo): Event date and time information.
 *   - `description` (string): Event description (default: "", trimmed).
 *   - `timeZone` (string): Valid IANA timezone (default: "Etc/UTC").
 *   - `location` (string): Event location (max 1024 chars, trimmed).
 * @param options - Configuration object for event creation with sensible defaults:
 *   - `prefix` (string): Text to add before the event name
 *   - `suffix` (string): Text to add after the event name
 *   - `fieldsToReturn` (EventFieldsToReturn): Array of field configurations specifying which properties to include in the response (defaults to Event URL, Event ID, and Synced Calendar ID)
 *
 * @returns Tana Paste formatted string containing the specified event fields
 */
export async function createEvent(
	accessToken: string,
	calendarId: string,
	data: EventData,
	options: EventOptions = DEFAULT_OPTIONS
): Promise<string> {
	const { name, description, date, timeZone, location } = data;
	const { start, end } = buildEventDateTimeInfo(date, timeZone);

	const event = await gc.insertEvent(accessToken, calendarId, {
		summary: buildSummary(name, options),
		description,
		location,
		start,
		end,
	});

	return buildTanaPaste(event, calendarId, options.fieldsToReturn!);
}

/**
 * Retrieves an existing event from the specified Google Calendar and returns event information
 * formatted as Tana Paste content for seamless integration into Tana.
 *
 * @param accessToken - The Google Calendar client access token
 * @param calendarId - The Google Calendar ID where the event is located
 * @param eventId - The unique identifier of the event to be retrieved
 * @param fieldsToReturn - Array of field configurations specifying which properties to include in the response:
 *   - `field` (string): The display name for the field in Tana
 *   - `property` (string): The corresponding property name from the event object (use "calendarId" for calendar ID)
 *
 * @returns Tana Paste formatted string containing the specified event fields
 */
export async function getEvent(
	accessToken: string,
	calendarId: string,
	eventId: string,
	fieldsToReturn: EventFieldsToReturn
): Promise<string> {
	const event = await gc.getEvent(accessToken, calendarId, eventId);

	if (!event) {
		throw new Error(`Event not found: ${eventId}`);
	}

	return buildTanaPaste(event, calendarId, fieldsToReturn);
}

/**
 * Updates an existing event in the specified Google Calendar with optional calendar migration.
 * Supports partial updates - only provided fields will be updated.
 *
 * @param accessToken - The Google Calendar client access token
 * @param fromCalendarId - The current Google Calendar ID where the event is located
 * @param eventId - The unique identifier of the event to be updated
 * @param data - Partial event data object with optional properties:
 *   - `name` (string): Event title/summary (min 1 char, trimmed).
 *   - `date` (TanaDateInfo): Event date and time information.
 *   - `description` (string): Event description (trimmed).
 *   - `timeZone` (string): Valid IANA timezone.
 *   - `location` (string): Event location (max 1024 chars, trimmed).
 * @param options - Configuration object for event update with sensible defaults:
 *   - `prefix` (string): Text to add before the event name
 *   - `suffix` (string): Text to add after the event name
 *   - `fieldsToReturn` (EventFieldsToReturn): Array of field configurations specifying which properties to include in the response (defaults to Event URL, Event ID, and Synced Calendar ID)
 * @param toCalendarId - If provided and different from fromCalendarId, the event will be moved to this calendar before updating
 *
 * @returns Tana Paste formatted string containing the specified event fields from the updated event
 */
export async function updateEvent(
	accessToken: string,
	fromCalendarId: string,
	eventId: string,
	data: PartialEventData,
	options: EventOptions = DEFAULT_OPTIONS,
	toCalendarId?: string
): Promise<string> {
	let currentCalendarId = fromCalendarId;
	let event: gc.CalendarEvent = await gc.getEvent(
		accessToken,
		currentCalendarId,
		eventId
	);

	if (!event) {
		throw new Error(`Event not found: ${eventId}`);
	}

	// Move event to different calendar if toCalendarId is provided and different
	if (toCalendarId && toCalendarId !== fromCalendarId) {
		event = await gc.moveEventToAnotherCalendar(
			accessToken,
			fromCalendarId,
			eventId,
			toCalendarId
		);
		currentCalendarId = toCalendarId;
	}

	// Check if we need to update any fields
	const hasFieldsToUpdate = Object.keys(data).length > 0;
	if (hasFieldsToUpdate) {
		// Get current event if we don't have it from move operation
		if (!event) {
			event = await gc.getEvent(accessToken, currentCalendarId, eventId);
		}

		// Merge existing event data with updates
		const updatedEventData = { ...event };

		if (data.name !== undefined) {
			const newSummary = buildSummary(data.name, options);
			if (newSummary !== event.summary) {
				updatedEventData.summary = newSummary;
			}
		}
		if (
			data.description !== undefined &&
			data.description !== event.description
		) {
			updatedEventData.description = data.description;
		}
		if (data.location !== undefined && data.location !== event.location) {
			updatedEventData.location = data.location;
		}
		if (data.date !== undefined) {
			const { start, end } = buildEventDateTimeInfo(
				data.date,
				data.timeZone || 'Etc/UTC'
			);

			if (
				start.dateTime !== event.start?.dateTime ||
				start.date !== event.start?.date
			) {
				updatedEventData.start = start;
				updatedEventData.end = end;
			}
			if (
				end.dateTime !== event.end?.dateTime ||
				end.date !== event.end?.date
			) {
				updatedEventData.end = end;
			}
		}

		event = await gc.updateEvent(
			accessToken,
			currentCalendarId,
			eventId,
			updatedEventData
		);
	}

	return buildTanaPaste(event, currentCalendarId, options.fieldsToReturn!);
}

/**
 * Deletes an existing event from the specified Google Calendar.
 *
 * @param accessToken - The Google Calendar client access token
 * @param calendarId - The Google Calendar ID where the event will be deleted from
 * @param eventId - The unique identifier of the event to be deleted
 *
 * @returns Promise resolving to boolean indicating whether the event was successfully deleted
 */
export async function deleteEvent(
	accessToken: string,
	calendarId: string,
	eventId: string
): Promise<boolean> {
	return await gc.deleteEvent(accessToken, calendarId, eventId);
}
