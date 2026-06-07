import { describe, expect, test } from 'vitest';

import { RESULT_CODE, STATUS_CODE } from '@/common/constants/response.const';
import { NotFoundError } from '@/common/errors/notfound-error';
import { ErrorResponse } from '@/common/responses/api-error-response';

describe('NotFoundError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new NotFoundError('test not found error');
    }).toThrowError('test not found error');
  });

  test('ErrorResponse.fromError should return correct shape', () => {
    const error = new NotFoundError('test error');
    const response = ErrorResponse.fromError(error);

    expect(response.json).toEqual({
      result: {
        code: RESULT_CODE.NOT_FOUND,
        message: 'test error',
      },
      error: {
        error_message: 'test error',
        error_detail: null,
      },
    });
    expect(response.statusCode).toBe(STATUS_CODE.NOT_FOUND);
  });
});
