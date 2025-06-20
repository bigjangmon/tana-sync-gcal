import type { ZodError } from 'zod';

export function formatZodErrors(errors: ZodError): string {
	return (
		`validation error: [\n` +
		errors.errors
			.map((error) => `- ${error.path.join('.')} ${error.message}`)
			.join('\n') +
		'\n]'
	);
}
