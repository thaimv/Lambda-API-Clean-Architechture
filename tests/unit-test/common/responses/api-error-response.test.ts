import { describe, expect, test } from 'vitest';

import { RESULT_CODE } from '@/common/constants/response.const';
import { HttpStatusCode } from '@/common/constants/rest-api.const';
import { NotFoundError } from '@/common/errors/notfound-error';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';
import { ErrorResponse } from '@/common/responses/api-error-response';

describe('ErrorResponse', () => {
  test('uses null error_detail when detail is omitted', () => {
    const response = new ErrorResponse({
      code: RESULT_CODE.UNAUTHORIZED,
      message: 'Unauthorized',
      detail: undefined as never,
      statusCode: HttpStatusCode.UNAUTHORIZED,
    });

    expect(response.json.error.error_detail).toBeNull();
  });

  test('builds standardized error body', () => {
    const response = new ErrorResponse({
      code: RESULT_CODE.BAD_REQUEST,
      message: 'Invalid input',
      detail: { field: 'name' },
      statusCode: HttpStatusCode.BAD_REQUEST,
    });

    expect(response.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(response.json).toEqual({
      result: {
        code: RESULT_CODE.BAD_REQUEST,
        message: 'Invalid input',
      },
      error: {
        error_message: 'Invalid input',
        error_detail: { field: 'name' },
      },
    });
  });

  test('fromError maps BaseError fields', () => {
    const error = new NotFoundError('Resource missing');
    const response = ErrorResponse.fromError<{ id: string }>(error);

    expect(response.statusCode).toBe(error.statusCode);
    expect(response.json.result.code).toBe(error.code);
    expect(response.json.error.error_message).toBe('Resource missing');
    expect(response.json.error.error_detail).toBeNull();
  });

  test('fromError includes null error_detail for UnauthorizedError', () => {
    const response = ErrorResponse.fromError(new UnauthorizedError());

    expect(response.json.error).toEqual({
      error_message: 'Unauthorized',
      error_detail: null,
    });
  });
});
