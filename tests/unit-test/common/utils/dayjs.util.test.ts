import { describe, expect, test } from 'vitest';

import { ERROR_MESSAGE } from '@/common/constants/response.const';
import { InternalServerError } from '@/common/errors/internal-server-error';
import {
  DAYJS_TIMEZONE_DATE_FORMAT,
  getDateFormat,
  getDateKeepTimeZone,
  getEndOfMonthFormat,
  getIso8601Microseconds,
  getJstDateFormat,
  getNowWithServerTimezone,
  getStartOfMonthFormat,
  getTzDate,
  getTzOffset,
  getUtcDateFormat,
} from '@/common/utils/dayjs.util';

describe('dayjs.util', () => {
  const sampleDate = '2025-06-15T12:30:45.123+09:00';

  test('formats dates with and without timezone offset', () => {
    expect(getDateFormat(sampleDate, 'YYYY-MM-DD')).toBe('2025-06-15');
    expect(getDateFormat(sampleDate, 'YYYY-MM-DD', '+09:00')).toBe('2025-06-15');
  });

  test('returns month boundaries', () => {
    expect(getStartOfMonthFormat(sampleDate, 'YYYY-MM-DD')).toBe('2025-06-01');
    expect(getEndOfMonthFormat(sampleDate, 'YYYY-MM-DD')).toBe('2025-06-30');
  });

  test('returns microsecond iso8601 string', () => {
    const result = getIso8601Microseconds(new Date('2025-06-15T12:30:45.123Z'));
    expect(result).toBe('2025-06-15T12:30:45.123000');
  });

  test('returns utc and jst formatted dates', () => {
    expect(getUtcDateFormat(sampleDate, 'YYYY-MM-DD')).toBe('2025-06-15');
    expect(getJstDateFormat(sampleDate, 'YYYY-MM-DD')).toBe('2025-06-15');
  });

  test('extracts timezone offset and date parts', () => {
    expect(getTzOffset('+09:00')).toBe('+09:00');
    expect(getTzDate(sampleDate)).toBe('2025-06-15');
  });

  test('throws for invalid timezone offset and date format', () => {
    expect(() => getTzOffset('invalid')).toThrow(InternalServerError);
    expect(() => getTzOffset('invalid')).toThrow(ERROR_MESSAGE.INVALID_TIMEZONE_OFFSET);
    expect(() => getTzDate('invalid-date')).toThrow(InternalServerError);
  });

  test('keeps original timezone when formatting', () => {
    expect(getDateKeepTimeZone(sampleDate, DAYJS_TIMEZONE_DATE_FORMAT)).toBe(sampleDate);
  });

  test('returns current server timezone timestamp', () => {
    expect(getNowWithServerTimezone()).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{4}$/,
    );
  });
});
