import { describe, expect, it } from 'vitest';

import { NotFoundError } from '@/common/errors/notfound-error';
import { ErrorResponse } from '@/common/responses/api-error-response';
import { isGraphQLErrorOutput } from '@/common/types/lambda.type';

describe('lambda.type', () => {
  describe('isGraphQLErrorOutput', () => {
    it('should return true for ErrorResponse output', () => {
      const output = ErrorResponse.fromError(new NotFoundError('not found'));

      expect(isGraphQLErrorOutput(output)).toBe(true);
    });

    it('should return false for plain success payload', () => {
      expect(isGraphQLErrorOutput({ gigyaUuid: 'user-1', userNickname: 'demo' })).toBe(false);
    });

    it('should return false for nullish values', () => {
      expect(isGraphQLErrorOutput(null)).toBe(false);
      expect(isGraphQLErrorOutput(undefined)).toBe(false);
    });
  });
});
