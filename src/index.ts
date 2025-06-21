import { Hono } from 'hono';
import events from './api/events';

const app = new Hono();

app.get('/', (c) => {
	return c.text('Hello');
});

app.route('/events', events);

export default app;
