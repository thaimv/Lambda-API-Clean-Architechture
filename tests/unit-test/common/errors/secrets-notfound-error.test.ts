import { describe, expect, test } from 'vitest';

import { RESULT_CODE } from '@/common/constants/response.const';
import { SecretsNotFoundError } from '@/common/errors/secrets-notfound-error';

describe('SecretsNotFoundError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new SecretsNotFoundError('missing secret');
    }).toThrowError('missing secret');
  });

  test('should have SECRETS_NOT_FOUND result code', () => {
    const error = new SecretsNotFoundError('missing secret');
    expect(error.code).toBe(RESULT_CODE.SECRETS_NOT_FOUND);
  });
});
