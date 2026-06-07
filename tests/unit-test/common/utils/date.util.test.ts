import { describe, expect, test } from 'vitest';

import { isIsoDate, isIsoTimezoneDate } from '@/common/utils/date.util';

describe('date.util', () => {
  test('isIsoDate validates UTC iso8601 strings', () => {
    expect(isIsoDate('2025-01-15T10:30:00.000Z')).toBe(true);
    expect(isIsoDate('2025-01-15T10:30:00.000')).toBe(false);
    expect(isIsoDate('invalid')).toBe(false);
  });

  test('isIsoTimezoneDate validates offset iso8601 strings', () => {
    expect(isIsoTimezoneDate('2025-11-17T15:07:58.865+09:00')).toBe(true);
    expect(isIsoTimezoneDate('invalid')).toBe(false);
  });
});
