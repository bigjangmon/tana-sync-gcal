import { z } from 'zod';
import { env } from 'hono/adapter';
import type { Context } from 'hono';
import GoogleAuth, { GoogleKey } from 'cloudflare-workers-and-google-oauth';
import { formatZodErrors } from '@/common/utils/zod-wrapper';

const googleAuthEnvSchema = z.object({
	GOOGLE_PROJECT_ID: z.string().min(1, 'Google project ID is required'),
	GOOGLE_PRIVATE_KEY_ID: z.string().min(1, 'Google private key ID is required'),
	GOOGLE_CLIENT_EMAIL: z
		.string()
		.email('Valid Google service account email required'),
	GOOGLE_PRIVATE_KEY: z.string().min(1, 'Google private key is required'),
	GOOGLE_CLIENT_ID: z.string().min(1, 'Google client ID is required'),
});

export type GoogleAuthEnv = z.infer<typeof googleAuthEnvSchema>;

export function getValidatedGoogleAuthEnv(c: Context): GoogleAuthEnv {
	const rawEnv = env<GoogleAuthEnv>(c);
	const parsedEnv = googleAuthEnvSchema.safeParse(rawEnv);

	if (!parsedEnv.success) {
		throw new Error(formatZodErrors(parsedEnv.error).join('\n'));
	}

	return parsedEnv.data;
}

/**
 * Generate access token using service account credentials with cloudflare-workers-and-google-oauth
 */
export async function getAccessToken(
	variables: GoogleAuthEnv
): Promise<string> {
	// Create Google service account key object
	const googleKey: GoogleKey = {
		type: 'service_account',
		project_id: variables.GOOGLE_PROJECT_ID,
		private_key_id: variables.GOOGLE_PRIVATE_KEY_ID,
		private_key: variables.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
		client_email: variables.GOOGLE_CLIENT_EMAIL,
		client_id: variables.GOOGLE_CLIENT_ID,
		auth_uri: 'https://accounts.google.com/o/oauth2/auth',
		token_uri: 'https://oauth2.googleapis.com/token',
		auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
		client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
			variables.GOOGLE_CLIENT_EMAIL
		)}`,
	};

	const scopes = [
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/calendar.events',
	];

	const oauth = new GoogleAuth(googleKey, scopes);
	const token = await oauth.getGoogleAuthToken();

	if (!token) {
		throw new Error('Failed to obtain access token from Google OAuth');
	}

	return token;
}
