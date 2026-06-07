import { afterEach, describe, expect, test, vi } from 'vitest';

import { getEnv } from '@/common/utils/env.util';

describe('getEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('returns environment variable value', () => {
    vi.stubEnv('TEST_ENV_KEY', 'value');
    expect(getEnv('TEST_ENV_KEY')).toBe('value');
  });

  test('returns default value when env is missing', () => {
    delete process.env.TEST_ENV_DEFAULT;
    expect(getEnv('TEST_ENV_DEFAULT', 'fallback')).toBe('fallback');
  });

  test('throws when env is missing and no default is provided', () => {
    delete process.env.TEST_ENV_MISSING;
    expect(() => getEnv('TEST_ENV_MISSING')).toThrow(
      'TEST_ENV_MISSING environment variable does not set',
    );
  });
});
