import type { ConfigType } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { DATE_FORMAT, REGEX } from '@/common/constants/app.const';
import { ERROR_MESSAGE } from '@/common/constants/response.const';
import { InternalServerError } from '@/common/errors/internal-server-error';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const DAYJS_TIMEZONE_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

export const getDateFormat = (date: ConfigType, format?: string, tzOffset?: string) => {
  if (tzOffset) {
    return dayjs(date).utcOffset(tzOffset).format(format);
  }

  return dayjs(date).format(format);
};

export const getStartOfMonthFormat = (date: ConfigType, format?: string) => {
  return dayjs(date).startOf('month').format(format);
};

export const getEndOfMonthFormat = (date: ConfigType, format?: string) => {
  return dayjs(date).endOf('month').format(format);
};

export const getIso8601Microseconds = (date: Date): string => {
  const d = dayjs(date).utc();
  const micros = String(d.millisecond() * 1000).padStart(6, '0');
  return `${d.format('YYYY-MM-DDTHH:mm:ss')}.${micros}`;
};

export const getUtcDateFormat = (date: ConfigType, format?: string) => {
  return dayjs.utc(date).format(format);
};

export const getJstDateFormat = (date: ConfigType, format?: string) => {
  return dayjs(date).tz('Asia/Tokyo').format(format);
};

export const getTzOffset = (date: string): string => {
  const offset = date.slice(-6);

  if (!REGEX.TIMEZONE_OFFSET.test(offset)) {
    throw new InternalServerError(ERROR_MESSAGE.INVALID_TIMEZONE_OFFSET);
  }

  return offset;
};

export const getTzDate = (date: string): string => {
  const tzDate = date.split('T')[0];

  if (!dayjs(tzDate, DATE_FORMAT.YYYY_MM_DD, true).isValid()) {
    throw new InternalServerError(
      ERROR_MESSAGE.INVALID_DATE_FORMAT.replace('<date_format>', DATE_FORMAT.YYYY_MM_DD),
    );
  }

  return tzDate;
};

export const getNowWithServerTimezone = () => {
  const d = dayjs();
  const offset = d.format('Z').replace(':', '');

  return `${d.format('YYYY-MM-DD HH:mm:ss.SSS')} ${offset}`;
};

/**
 * Convert date while keeping the original timezone offset.
 */
export const getDateKeepTimeZone = (dateTzStr: string, format?: string) => {
  const originalTimezone = dateTzStr.slice(-6);
  return dayjs(dateTzStr).utcOffset(originalTimezone).format(format);
};

export const dayjsWithPlugins = dayjs;
export { dayjs };
