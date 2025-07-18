import { z } from 'zod';
import type { calendar_v3 } from '@googleapis/calendar';

const TANA_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TANA_DATE_TIME_REGEX =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?$/;

export type TanaDateValue =
	| `[[date:${string}-${string}-${string}]]` // 1. date only, no time or end date: [[date:2025-06-18]]
	| `[[date:${string}-${string}-${string}T${string}:${string}]]` // 2. date with start time, no end date: [[date:2025-06-18T00:00]]
	| `[[date:${string}-${string}-${string}T${string}:${string}:${string}]]` // 2b. date with start time including seconds: [[date:2025-06-18T00:00:00]]
	| `[[date:${string}-${string}-${string}T${string}:${string}:${string}.${string}]]` // 2c. date with start time including milliseconds: [[date:2025-06-18T00:00:00.000]]
	| `[[date:${string}-${string}-${string}/${string}-${string}-${string}]]` // 3. date range without times: [[date:2025-06-18/2025-06-19]]
	| `[[date:${string}-${string}-${string}T${string}:${string}/${string}-${string}-${string}]]` // 4. start time with end date, no end time: [[date:2025-06-18T08:00/2025-06-19]]
	| `[[date:${string}-${string}-${string}T${string}:${string}:${string}/${string}-${string}-${string}]]` // 4b. start time with seconds and end date: [[date:2025-06-18T08:00:00/2025-06-19]]
	| `[[date:${string}-${string}-${string}T${string}:${string}:${string}.${string}/${string}-${string}-${string}]]` // 4c. start time with milliseconds and end date: [[date:2025-06-18T08:00:00.000/2025-06-19]]
	| `[[date:${string}-${string}-${string}T${string}:${string}/${string}-${string}-${string}T${string}:${string}]]` // 5. full date-time range: [[date:2025-06-18T08:00/2025-06-19T08:00]]
	| `[[date:${string}-${string}-${string}T${string}:${string}:${string}/${string}-${string}-${string}T${string}:${string}:${string}]]` // 5b. full date-time range with seconds: [[date:2025-06-18T08:00:00/2025-06-19T08:00:00]]
	| `[[date:${string}-${string}-${string}T${string}:${string}:${string}.${string}/${string}-${string}-${string}T${string}:${string}:${string}.${string}]]`; // 5c. full date-time range with milliseconds: [[date:2025-06-18T08:00:00.000/2025-06-19T08:00:00.000]]

export interface TanaDateInfo {
	original: TanaDateValue;
	start: string;
	end?: string;
}

export type EventDateTime =
	| {
			date: NonNullable<calendar_v3.Schema$EventDateTime['date']>;
			dateTime?: never;
			timeZone: calendar_v3.Schema$EventDateTime['timeZone'];
	  }
	| {
			date?: never;
			dateTime: NonNullable<calendar_v3.Schema$EventDateTime['dateTime']>;
			timeZone: calendar_v3.Schema$EventDateTime['timeZone'];
	  };

export interface EventDateTimeInfo
	extends Required<Pick<calendar_v3.Schema$Event, 'start' | 'end'>> {
	start: EventDateTime;
	end: EventDateTime;
}

function validateTanaDateValue(value: string): value is TanaDateValue {
	if (!value.startsWith('[[date:') || !value.endsWith(']]')) {
		return false;
	}

	const match = value.match(/^\[\[date:(.+)\]\]$/);
	if (!match || !match[1]) {
		return false;
	}

	const content = match[1];

	if (!content.trim()) {
		return false;
	}

	// Cases 1 & 2: Single date/datetime
	if (!content.includes('/')) {
		return TANA_DATE_REGEX.test(content) || TANA_DATE_TIME_REGEX.test(content);
	}

	// Cases 3, 4 & 5: Date range
	const [startPart, endPart] = content.split('/');

	if (!startPart || !endPart) {
		return false;
	}

	const startValid =
		TANA_DATE_REGEX.test(startPart) || TANA_DATE_TIME_REGEX.test(startPart);
	const endValid =
		TANA_DATE_REGEX.test(endPart) || TANA_DATE_TIME_REGEX.test(endPart);

	return startValid && endValid;
}

export function extractTanaDateInfo(date: TanaDateValue): TanaDateInfo {
	const content = date.replace(/^\[\[date:(.+)\]\]$/, '$1');

	// Cases 1 & 2: Single date/datetime
	if (!content.includes('/')) {
		return {
			original: date,
			start: content,
		};
	}

	// Cases 3, 4 & 5: Date range
	const [startPart, endPart] = content.split('/');

	return {
		original: date,
		start: startPart,
		end: endPart,
	};
}

export const TanaDateInfoSchema = z
	.string()
	.min(1, 'Date value cannot be empty')
	.refine(validateTanaDateValue, (value) => ({
		message: `Invalid Tana date format: "${value}". Expected formats:
	- "[[date:YYYY-MM-DD]]" => Single date
	- "[[date:YYYY-MM-DDTHH:MM]]" => Single date with time
	- "[[date:YYYY-MM-DDTHH:MM:SS]]" => Single date with seconds
	- "[[date:YYYY-MM-DDTHH:MM:SS.SSS]]" => Single date with milliseconds
	- "[[date:YYYY-MM-DD/YYYY-MM-DD]]" => Date range
	- "[[date:YYYY-MM-DDTHH:MM/YYYY-MM-DD]]" => Start time with end date
	- "[[date:YYYY-MM-DDTHH:MM:SS/YYYY-MM-DD]]" => Start time with seconds and end date
	- "[[date:YYYY-MM-DDTHH:MM:SS.SSS/YYYY-MM-DD]]" => Start time with milliseconds and end date
	- "[[date:YYYY-MM-DDTHH:MM/YYYY-MM-DDTHH:MM]]" => Full date-time range
	- "[[date:YYYY-MM-DDTHH:MM:SS/YYYY-MM-DDTHH:MM:SS]]" => Full date-time range with seconds
	- "[[date:YYYY-MM-DDTHH:MM:SS.SSS/YYYY-MM-DDTHH:MM:SS.SSS]]" => Full date-time range with milliseconds
	Example: "[[date:2025-01-15]]" or "[[date:2025-01-15T09:30/2025-01-16T17:00]]"`,
	}))
	.transform(extractTanaDateInfo);

export function buildEventDateTimeInfo(
	dateInfo: TanaDateInfo,
	timeZone: NonNullable<calendar_v3.Schema$EventDateTime['timeZone']>
): EventDateTimeInfo {
	function createEventDateTime(dateTimeString: string): EventDateTime {
		if (TANA_DATE_TIME_REGEX.test(dateTimeString)) {
			// If the string already has seconds, use it as is
			// If it only has HH:MM, append :00 for seconds
			const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(
				dateTimeString
			);
			const dateTime = hasSeconds ? dateTimeString : `${dateTimeString}:00`;

			return {
				dateTime,
				timeZone,
			};
		} else if (TANA_DATE_REGEX.test(dateTimeString)) {
			return {
				date: dateTimeString,
				timeZone,
			};
		} else {
			throw new Error(`Invalid date/time format: ${dateTimeString}`);
		}
	}

	const start = createEventDateTime(dateInfo.start);
	const end = dateInfo?.end ? createEventDateTime(dateInfo.end) : start;

	return { start, end };
}
