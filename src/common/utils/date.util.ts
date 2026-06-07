import { DAYJS_TIMEZONE_DATE_FORMAT, getDateKeepTimeZone } from '@/common/utils/dayjs.util';

/**
 * Check string is Datetime is iso8601 string
 * @param dateIsoString - string iso 8601 datetime
 * @returns is iso 8601 datetime or not
 */
export function isIsoDate(dateIsoString: string) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(dateIsoString)) return false;
  const d = new Date(dateIsoString);
  return !isNaN(d.getTime()) && d.toISOString() === dateIsoString; // valid date
}

/**
 * Check string is Datetime is iso8601 with timezone string
 * @param dateIsoString - string iso 8601 timezone. Ex: 2025-11-17T15:07:58.865+09:00
 * @returns is iso 8601 datetime or not
 */
export function isIsoTimezoneDate(dateOffsetString: string) {
  const ISO_WITH_TIMEZONE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/;
  if (!ISO_WITH_TIMEZONE_REGEX.test(dateOffsetString)) return false;

  return getDateKeepTimeZone(dateOffsetString, DAYJS_TIMEZONE_DATE_FORMAT) === dateOffsetString;
}
