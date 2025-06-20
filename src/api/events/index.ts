import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { BlankSchema } from 'hono/types';
import { zValidator } from '@hono/zod-validator';
import {
	EventDataSchema,
	PostEventQuerySchema,
	DeleteEventQuerySchema,
	UpdateEventQuerySchema,
	PartialEventDataSchema,
} from './schemas';
import { createEventService } from './service';
import { formatZodErrors } from '../../common/utils/format-zod-errors';
import type { CalendarClient } from '../../common/utils/google-calendar';

const app = new Hono<
	{
		Variables: {
			calendarClient: CalendarClient;
			eventService: ReturnType<typeof createEventService>;
		};
	},
	BlankSchema,
	'/events'
>();

app.use('*', async (c, next) => {
	const calendarClient = c.get('calendarClient');
	const eventService = createEventService(calendarClient);
	c.set('eventService', eventService);
	await next();
});

app.post(
	'/',
	zValidator('query', PostEventQuerySchema),
	zValidator('json', EventDataSchema, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, {
				message: `Invalid event data: ${formatZodErrors(result.error)}`,
			});
		}
	}),
	async (c) => {
		const eventService = c.get('eventService');
		const { to: calendarId } = c.req.valid('query');
		const data = c.req.valid('json');
		const ret = await eventService.createEvent(calendarId, data);

		return c.text(ret);
	}
);

app.put(
	'/:eventId',
	zValidator('query', UpdateEventQuerySchema),
	zValidator('json', PartialEventDataSchema, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, {
				message: `Invalid event data: ${formatZodErrors(result.error)}`,
			});
		}
	}),
	async (c) => {
		const eventService = c.get('eventService');
		const { from: fromCalendarId, to: toCalendarId } = c.req.valid('query');
		const { eventId } = c.req.param();
		const data = c.req.valid('json');

		const ret = await eventService.updateEvent(
			fromCalendarId,
			eventId,
			data,
			toCalendarId
		);

		return c.text(ret);
	}
);

app.delete(
	'/:eventId',
	zValidator('query', DeleteEventQuerySchema),
	async (c) => {
		const eventService = c.get('eventService');
		const { from: calendarId } = c.req.valid('query');
		const { eventId } = c.req.param();

		const success = await eventService.deleteEvent(calendarId, eventId);

		return c.text(
			success
				? `Event deleted successfully: ${eventId}`
				: `Failed to delete event: ${eventId}`
		);
	}
);

export default app;
