import type { EventData, PartialEventData } from './schemas';
import * as gc from '../../common/utils/google-calendar';
import { buildEventDateTimeInfo } from '../../common/utils/handle-tana-date';

export function createEventService(client: gc.CalendarClient) {
	const _buildTanaPaste = (event: gc.CalendarEvent, calendarId: string) => {
		return `Event URL::${event.htmlLink}\nEvent ID::${event.id}\nSynced Calendar ID::${calendarId}`;
	};

	/**
	 * Creates a new event in the specified Google Calendar and returns event information
	 * formatted as Tana Paste content for seamless import into Tana.
	 *
	 * @param calendarId - The Google Calendar ID where the event will be created
	 * @param data - Event data object with the following properties:
	 *   - `name` (string): **Required**. Event title/summary (min 1 char, trimmed).
	 *   - `date` (TanaDateInfo): **Required**. Event date and time information.
	 *   - `description` (string): *Optional*. Event description (default: "", trimmed).
	 *   - `timeZone` (string): *Optional*. Valid IANA timezone (default: "Etc/UTC").
	 *   - `location` (string): *Optional*. Event location (max 1024 chars, trimmed).
	 *
	 * @returns Promise resolving to Tana Paste formatted string with event URL and ID fields
	 */
	const createEvent = async (
		calendarId: string,
		data: EventData
	): Promise<string> => {
		const { name, description, date, timeZone, location } = data;
		const { start, end } = buildEventDateTimeInfo(date, timeZone);

		const event = await gc.insertEvent(client, calendarId, {
			summary: name,
			description,
			location,
			start,
			end,
		});

		return _buildTanaPaste(event, calendarId);
	};

	/**
	 * Updates an existing event in the specified Google Calendar with optional calendar migration.
	 * Supports partial updates - only provided fields will be updated.
	 *
	 * @param fromCalendarId - The current Google Calendar ID where the event is located
	 * @param eventId - The unique identifier of the event to be updated
	 * @param data - Partial event data object with optional properties:
	 *   - `name` (string): Event title/summary (min 1 char, trimmed).
	 *   - `date` (TanaDateInfo): Event date and time information.
	 *   - `description` (string): Event description (trimmed).
	 *   - `timeZone` (string): Valid IANA timezone.
	 *   - `location` (string): Event location (max 1024 chars, trimmed).
	 * @param toCalendarId - Optional. If provided and different from fromCalendarId,
	 *                       the event will be moved to this calendar before updating
	 *
	 * @returns Promise resolving to Tana Paste formatted string with updated event URL and ID fields
	 */
	const updateEvent = async (
		fromCalendarId: string,
		eventId: string,
		data: PartialEventData,
		toCalendarId?: string
	): Promise<string> => {
		let currentCalendarId = fromCalendarId;
		let event: gc.CalendarEvent | undefined;

		// Move event to different calendar if toCalendarId is provided and different
		if (toCalendarId && toCalendarId !== fromCalendarId) {
			event = await gc.moveEventToAnotherCalendar(
				client,
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
				event = await gc.getEvent(client, currentCalendarId, eventId);
			}

			// Merge existing event data with updates
			const updatedEventData = { ...event };

			if (data.name !== undefined) {
				updatedEventData.summary = data.name;
			}
			if (data.description !== undefined) {
				updatedEventData.description = data.description;
			}
			if (data.location !== undefined) {
				updatedEventData.location = data.location;
			}
			if (data.date !== undefined) {
				const { start, end } = buildEventDateTimeInfo(
					data.date,
					data.timeZone || 'Etc/UTC'
				);
				updatedEventData.start = start;
				updatedEventData.end = end;
			}

			// Update the event with complete data
			event = await gc.updateEvent(
				client,
				currentCalendarId,
				eventId,
				updatedEventData
			);
		}

		if (!event) {
			event = await gc.getEvent(client, currentCalendarId, eventId);
		}

		return _buildTanaPaste(event, currentCalendarId);
	};

	/**
	 * Deletes an existing event from the specified Google Calendar.
	 *
	 * @param calendarId - The Google Calendar ID where the event will be deleted from
	 * @param eventId - The unique identifier of the event to be deleted
	 *
	 * @returns Promise resolving to boolean indicating whether the event was successfully deleted
	 */
	const deleteEvent = async (
		calendarId: string,
		eventId: string
	): Promise<boolean> => {
		return await gc.deleteEvent(client, calendarId, eventId);
	};

	return {
		createEvent,
		updateEvent,
		deleteEvent,
	};
}
