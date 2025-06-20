import { calendar_v3, google } from 'googleapis';

export type CalendarClient = calendar_v3.Calendar;

/**
 * - Returns a calendar client to manipulate events and other calendar data.
 *
 * @reference https://googleapis.dev/nodejs/googleapis/latest/calendar/classes/Calendar.html#info
 */
export function createCalendarClient(
	email: string,
	privateKey: string
): CalendarClient {
	const auth = new google.auth.JWT({
		email,
		key: privateKey.replace(/\\n/g, '\n'),
		scopes: [
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/calendar.events',
		],
	});
	return google.calendar({ version: 'v3', auth });
}

/**
 * - Returns events on the specified calendar.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/list
 */
export async function listEvents(
	client: CalendarClient,
	calendarId: string,
	params?: {
		timeMin?: string;
		timeMax?: string;
		maxResults?: number;
		orderBy?: 'startTime' | 'updated';
		singleEvents?: boolean;
	}
): Promise<calendar_v3.Schema$Events> {
	const res = await client.events.list({
		calendarId,
		timeMin: params?.timeMin,
		timeMax: params?.timeMax,
		maxResults: params?.maxResults,
		orderBy: params?.orderBy,
		singleEvents: params?.singleEvents,
	});

	return res.data;
}

/**
 * - Returns an event based on its Google Calendar ID.
 * - To retrieve an event using its iCalendar ID,
 * call the [events.list method using the iCalUID parameter.](https://developers.google.com/workspace/calendar/api/v3/reference/events/list#iCalUID)
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/get
 */
export async function getEvent(
	client: CalendarClient,
	calendarId: string,
	eventId: string
): Promise<calendar_v3.Schema$Event> {
	const res = await client.events.get({ calendarId, eventId });

	return res.data;
}

/**
 * - Creates a new calendar event.
 * - Attendees cannot be invited when using service account authentication
 * without Domain-Wide Delegation configured.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
 */
export async function insertEvent(
	client: CalendarClient,
	calendarId: string,
	event: Omit<calendar_v3.Schema$Event, 'attendees'>
): Promise<calendar_v3.Schema$Event> {
	const res = await client.events.insert({
		calendarId,
		requestBody: event,
	});

	return res.data;
}

/**
 * - Updates an event.
 * - This method does not support patch semantics and always updates the entire event resource.
 * - To do a partial update, perform a `get` followed by an `update` using etags to ensure atomicity.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/update
 */
export async function updateEvent(
	client: CalendarClient,
	calendarId: string,
	eventId: string,
	event: calendar_v3.Schema$Event
): Promise<calendar_v3.Schema$Event> {
	const res = await client.events.update({
		calendarId,
		eventId,
		requestBody: event,
	});

	return res.data;
}

/**
 * - Moves an event to another calendar, i.e. changes an event's organizer.
 * - Note that only `default` events can be moved;
 * `birthday`, `focusTime`, `fromGmail`, `outOfOffice` and `workingLocation` events cannot be moved
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/move
 */
export async function moveEventToAnotherCalendar(
	client: CalendarClient,
	calendarId: string,
	eventId: string,
	destinationCalendarId: string
): Promise<calendar_v3.Schema$Event> {
	const res = await client.events.move({
		calendarId,
		eventId,
		destination: destinationCalendarId,
	});

	return res.data;
}

/**
 * - Deletes an event.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/delete
 */
export async function deleteEvent(
	client: CalendarClient,
	calendarId: string,
	eventId: string
): Promise<boolean> {
	await client.events.delete({
		calendarId,
		eventId,
	});

	return true;
}
