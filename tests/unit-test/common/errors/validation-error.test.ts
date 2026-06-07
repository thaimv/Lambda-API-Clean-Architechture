import { describe, expect, test } from 'vitest';

import { ValidationError } from '@/common/errors/validation-error';

describe('ValidationError', () => {
  test('should throw with correct message', () => {
    expect(() => {
      throw new ValidationError('test validation error');
    }).toThrowError('test validation error');
  });
});
