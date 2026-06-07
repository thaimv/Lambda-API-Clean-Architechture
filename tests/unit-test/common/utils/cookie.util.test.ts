import { describe, expect, test } from 'vitest';

import { CookieUtil } from '@/common/utils/cookie.util';

describe('CookieUtil', () => {
  test('getValue returns cookie value by key', () => {
    const cookie = 'session=abc123; user=test; path=/';

    expect(CookieUtil.getValue(cookie, 'session')).toBe('abc123');
    expect(CookieUtil.getValue(cookie, 'user')).toBe('test');
  });

  test('getValue returns empty string when key is missing', () => {
    expect(CookieUtil.getValue('session=abc123', 'missing')).toBe('');
  });
});
