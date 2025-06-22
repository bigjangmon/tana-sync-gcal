import { Hono } from 'hono';
import { cors } from 'hono/cors';
import events from './api/events';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use('*', (c, next) => {
	if (c.env.WORKER_ENV === 'development') {
		return cors({
			origin: ['https://app.tana.inc'],
			credentials: true,
		})(c, next);
	}
	return next();
});

app.get('/', (c) => {
	return c.text('Hello');
});

app.route('/events', events);

export default app;
