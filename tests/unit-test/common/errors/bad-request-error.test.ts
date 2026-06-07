import { describe, expect, test } from 'vitest';

import { BadRequestError } from '@/common/errors/bad-request-error';

describe('BadRequestError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new BadRequestError('test bad request error');
    }).toThrowError('test bad request error');
  });
});
