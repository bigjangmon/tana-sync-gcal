import type { ValidationTargets } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ZodError, ZodSchema } from 'zod';
import { zValidator as zv } from '@hono/zod-validator';
import { routePath } from 'hono/route';

export function formatZodErrors(errors: ZodError): string[] {
	const formattedErrors = errors.errors.map((error) => {
		const path = error.path.length > 0 ? error.path.join('.') : 'root';
		const message = error.message;
		const code = error.code;
		const received =
			'received' in error
				? ` (received: ${JSON.stringify(error.received)})`
				: '';

		return `- ${path}: ${message}${received} [${code}]`;
	});

	return formattedErrors;
}

export const zValidator = <
	T extends ZodSchema,
	Target extends keyof ValidationTargets
>(
	target: Target,
	schema: T
) =>
	zv(target, schema, (result, c) => {
		if (result.success) return;
		const method = c.req.method;
		const path = routePath(c);
		const title = `[${method} ${path}] ${target} validation failed`;
		const errors = formatZodErrors(result.error);

		console.error(title, {
			url: c.req.url,
			params: c.req.param(),
			queries: c.req.query(),
			data: result.data,
			errors: JSON.parse(JSON.stringify(errors)),
		});

		console.log(errors.join('\n'));
		throw new HTTPException(400, {
			message: `${title}:\n${errors.join('\n')}`,
		});
	});
