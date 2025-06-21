import { z } from 'zod';
import { TanaDateInfoSchema } from '@/common/utils/handle-tana-date';

export const PostEventQuerySchema = z.object({
	to: z
		.string({ required_error: 'to(Calendar ID) is required' })
		.min(1, 'to(Calendar ID) cannot be empty'),
});

export const DeleteEventQuerySchema = z.object({
	from: z
		.string({ required_error: 'from(Calendar ID) is required' })
		.min(1, 'from(Calendar ID) cannot be empty'),
});

export const UpdateEventQuerySchema = z.object({
	from: z
		.string({ required_error: 'from(Calendar ID) is required' })
		.min(1, 'from(Calendar ID) cannot be empty'),
	to: z.string().min(1, 'to(Calendar ID) cannot be empty').optional(),
});

export const EventDataSchema = z.object({
	name: z.string().min(1, 'Event name is required').trim(),
	date: TanaDateInfoSchema,
	description: z
		.string()
		.default('')
		.transform((val) => val.trim()),
	timeZone: z
		.string()
		.min(1, 'Time zone cannot be empty')
		.default('Etc/UTC')
		.refine(
			(tz) => {
				try {
					Intl.DateTimeFormat(undefined, { timeZone: tz });
					return true;
				} catch {
					return false;
				}
			},
			{ message: 'Invalid timezone format' }
		),
	location: z
		.string()
		.max(1024, 'Location is too long')
		.default('')
		.transform((val) => val.trim()),
});

export const PartialEventDataSchema = EventDataSchema.partial();

export type EventData = z.infer<typeof EventDataSchema>;
export type PartialEventData = z.infer<typeof PartialEventDataSchema>;
