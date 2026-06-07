import { describe, expect, test } from 'vitest';

import { InternalServerError } from '@/common/errors/internal-server-error';

describe('InternalServerError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new InternalServerError('test internal server error');
    }).toThrowError('test internal server error');
  });
});
