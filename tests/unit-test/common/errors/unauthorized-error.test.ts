import { describe, expect, test } from 'vitest';

import { ERROR_MESSAGE } from '@/common/constants/response.const';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';

describe('UnauthorizedError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new UnauthorizedError('test unauthorized error');
    }).toThrowError('test unauthorized error');
  });

  test('should throw default message when no argument', () => {
    expect(() => {
      throw new UnauthorizedError();
    }).toThrowError(ERROR_MESSAGE.UNAUTHORIZED);
  });
});
