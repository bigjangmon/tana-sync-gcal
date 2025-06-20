import { z } from 'zod';
import { env } from 'hono/adapter';
import type { Context } from 'hono';
import { formatZodErrors } from './format-zod-errors';

const envSchema = z.object({
	GOOGLE_CLIENT_EMAIL: z
		.string()
		.email('Valid Google service account email required'),
	GOOGLE_PRIVATE_KEY: z.string().min(1, 'Google private key is required'),
});

export type EnvSchema = z.infer<typeof envSchema>;

export function getValidatedEnv(c: Context): EnvSchema {
	const rawEnv = env<EnvSchema>(c);
	const parsedEnv = envSchema.safeParse(rawEnv);

	if (!parsedEnv.success) {
		throw new Error(formatZodErrors(parsedEnv.error));
	}

	return parsedEnv.data;
}
