import { describe, expect, test } from 'vitest';

import { RESULT_CODE } from '@/common/constants/response.const';
import { DatabaseUrlNotFoundError } from '@/common/errors/database-url-notfound-error';

describe('DatabaseUrlNotFoundError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new DatabaseUrlNotFoundError('missing db url');
    }).toThrowError('missing db url');
  });

  test('should have DATABASE_URL_NOT_FOUND result code', () => {
    const error = new DatabaseUrlNotFoundError('missing db url');
    expect(error.code).toBe(RESULT_CODE.DATABASE_URL_NOT_FOUND);
  });
});
