import type { EventFieldsToReturn, EventOptions } from './schemas';

export const DEFAULT_FIELDS_TO_RETURN = [
	{
		field: 'Event URL',
		property: 'htmlLink',
	},
	{
		field: 'Event ID',
		property: 'id',
	},
	{
		field: 'Synced Calendar ID',
		property: 'calendarId',
	},
] as const satisfies EventFieldsToReturn;

export const DEFAULT_OPTIONS = {
	prefix: undefined,
	suffix: undefined,
	fieldsToReturn: DEFAULT_FIELDS_TO_RETURN,
} as const satisfies EventOptions;
