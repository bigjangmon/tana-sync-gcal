import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { BlankSchema } from 'hono/types';
import { zValidator } from '@/common/utils/zod-wrapper';
import {
	getValidatedGoogleAuthEnv,
	getAccessToken,
} from '@/common/utils/google-auth';
import {
	EventDataSchema,
	PostEventQuerySchema,
	DeleteEventQuerySchema,
	PutEventQuerySchema,
	PartialEventDataSchema,
} from './schemas';
import * as eventService from './service';

const app = new Hono<
	{
		Variables: {
			accessToken: string;
		};
	},
	BlankSchema,
	'/events'
>();

app.use('*', async (c, next) => {
	try {
		const env = getValidatedGoogleAuthEnv(c);
		const accessToken = await getAccessToken(env);
		c.set('accessToken', accessToken);
		await next();
	} catch (error) {
		throw new HTTPException(401, {
			message: 'Authentication failed',
		});
	}
});

app.post(
	'/',
	zValidator('query', PostEventQuerySchema),
	zValidator('json', EventDataSchema),
	async (c) => {
		const accessToken = c.get('accessToken');
		const { to: calendarId } = c.req.valid('query');
		const data = c.req.valid('json');
		const ret = await eventService.createEvent(accessToken, calendarId, data);

		return c.text(ret);
	}
);

app.put(
	'/:eventId',
	zValidator('query', PutEventQuerySchema),
	zValidator('json', PartialEventDataSchema),
	async (c) => {
		const accessToken = c.get('accessToken');
		const { from: fromCalendarId, to: toCalendarId } = c.req.valid('query');
		const { eventId } = c.req.param();
		const data = c.req.valid('json');
		const ret = await eventService.updateEvent(
			accessToken,
			fromCalendarId,
			eventId,
			data,
			toCalendarId
		);

		return c.text(ret);
	}
);

app.post(
	'/:eventId/delete',
	zValidator('query', DeleteEventQuerySchema),
	async (c) => {
		const accessToken = c.get('accessToken');
		const { from: calendarId } = c.req.valid('query');
		const { eventId } = c.req.param();

		const success = await eventService.deleteEvent(
			accessToken,
			calendarId,
			eventId
		);

		const ret = success
			? `Event deleted successfully: ${eventId}`
			: `Failed to delete event: ${eventId}`;

		return c.text(ret);
	}
);

export default app;
