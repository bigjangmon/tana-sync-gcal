import type { calendar_v3 } from '@googleapis/calendar';

export type CalendarEvents = calendar_v3.Schema$Events;
export type CalendarEvent = calendar_v3.Schema$Event;

const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Make authenticated request to Google Calendar API
 */
async function makeCalendarRequest(
	token: string,
	path: string,
	options: RequestInit = {}
): Promise<Response> {
	const url = `${GOOGLE_API_BASE}${path}`;
	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Google Calendar API request failed: ${response.status} ${errorText}`
		);
	}
	return response;
}

/**
 * - Returns events on the specified calendar.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/list
 */
export async function listEvents(
	token: string,
	calendarId: string,
	params?: {
		timeMin?: string;
		timeMax?: string;
		maxResults?: number;
		orderBy?: 'startTime' | 'updated';
		singleEvents?: boolean;
	}
): Promise<CalendarEvents> {
	const searchParams = new URLSearchParams();
	if (params?.timeMin) searchParams.set('timeMin', params.timeMin);
	if (params?.timeMax) searchParams.set('timeMax', params.timeMax);
	if (params?.maxResults)
		searchParams.set('maxResults', params.maxResults.toString());
	if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
	if (params?.singleEvents)
		searchParams.set('singleEvents', params.singleEvents.toString());

	const path = `/calendars/${encodeURIComponent(
		calendarId
	)}/events?${searchParams.toString()}`;
	const response = await makeCalendarRequest(token, path);
	return await response.json();
}

/**
 * - Returns an event based on its Google Calendar ID.
 * - To retrieve an event using its iCalendar ID,
 * call the [events.list method using the iCalUID parameter.](https://developers.google.com/workspace/calendar/api/v3/reference/events/list#iCalUID)
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/get
 */
export async function getEvent(
	token: string,
	calendarId: string,
	eventId: string
): Promise<CalendarEvent> {
	const path = `/calendars/${encodeURIComponent(
		calendarId
	)}/events/${encodeURIComponent(eventId)}`;
	const response = await makeCalendarRequest(token, path);
	return await response.json();
}

/**
 * - Creates a new calendar event.
 * - Attendees cannot be invited when using service account authentication
 * without Domain-Wide Delegation configured.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
 */
export async function insertEvent(
	token: string,
	calendarId: string,
	event: Omit<CalendarEvent, 'attendees'>
): Promise<CalendarEvent> {
	const path = `/calendars/${encodeURIComponent(calendarId)}/events`;
	const response = await makeCalendarRequest(token, path, {
		method: 'POST',
		body: JSON.stringify(event),
	});
	return await response.json();
}

/**
 * - Updates an event.
 * - This method does not support patch semantics and always updates the entire event resource.
 * - To do a partial update, perform a `get` followed by an `update` using etags to ensure atomicity.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/update
 */
export async function updateEvent(
	token: string,
	calendarId: string,
	eventId: string,
	event: CalendarEvent
): Promise<CalendarEvent> {
	const path = `/calendars/${encodeURIComponent(
		calendarId
	)}/events/${encodeURIComponent(eventId)}`;
	const response = await makeCalendarRequest(token, path, {
		method: 'PUT',
		body: JSON.stringify(event),
	});
	return await response.json();
}

/**
 * - Moves an event to another calendar, i.e. changes an event's organizer.
 * - Note that only `default` events can be moved;
 * `birthday`, `focusTime`, `fromGmail`, `outOfOffice` and `workingLocation` events cannot be moved
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/move
 */
export async function moveEventToAnotherCalendar(
	token: string,
	calendarId: string,
	eventId: string,
	destinationCalendarId: string
): Promise<CalendarEvent> {
	const path = `/calendars/${encodeURIComponent(
		calendarId
	)}/events/${encodeURIComponent(
		eventId
	)}/move?destination=${encodeURIComponent(destinationCalendarId)}`;
	const response = await makeCalendarRequest(token, path, { method: 'POST' });
	return await response.json();
}

/**
 * - Deletes an event.
 *
 * @reference https://developers.google.com/workspace/calendar/api/v3/reference/events/delete
 */
export async function deleteEvent(
	token: string,
	calendarId: string,
	eventId: string
): Promise<boolean> {
	const path = `/calendars/${encodeURIComponent(
		calendarId
	)}/events/${encodeURIComponent(eventId)}`;
	await makeCalendarRequest(token, path, { method: 'DELETE' });
	return true;
}
