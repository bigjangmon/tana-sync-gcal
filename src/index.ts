import { Hono } from 'hono';
import {
	createCalendarClient,
	type CalendarClient,
} from './common/utils/google-calendar';
import { getValidatedEnv } from './common/utils/env';

const app = new Hono<{
	Variables: {
		calendarClient: CalendarClient;
	};
}>();

app.use('*', async (c, next) => {
	const env = getValidatedEnv(c);
	const client = createCalendarClient(
		env.GOOGLE_CLIENT_EMAIL,
		env.GOOGLE_PRIVATE_KEY
	);

	c.set('calendarClient', client);
	await next();
});

app.get('/', (c) => {
	return c.text('Hello');
});

export default app;
