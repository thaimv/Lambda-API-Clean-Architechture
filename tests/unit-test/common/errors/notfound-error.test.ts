import { describe, expect, test } from 'vitest';

import { RESULT_CODE, STATUS_CODE } from '@/common/constants/response.const';
import { NotFoundError } from '@/common/errors/notfound-error';

describe('NotFoundError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new NotFoundError('test not found error');
    }).toThrowError('test not found error');
  });

  test('toCustomError should return correct shape', () => {
    const error = new NotFoundError('test error');
    expect(error.toCustomError()).toEqual({
      error: {
        message: 'test error',
        extensions: {
          code: RESULT_CODE.NOT_FOUND,
          statusCode: STATUS_CODE.NOT_FOUND,
          details: undefined,
        },
      },
    });
  });
});
