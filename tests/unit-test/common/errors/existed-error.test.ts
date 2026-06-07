import { describe, expect, test } from 'vitest';

import { RESULT_CODE } from '@/common/constants/response.const';
import { ExistedError } from '@/common/errors/existed-error';

describe('ExistedError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new ExistedError('already exists');
    }).toThrowError('already exists');
  });

  test('should have EXISTED result code', () => {
    const error = new ExistedError('already exists');
    expect(error.code).toBe(RESULT_CODE.EXISTED);
  });
});
