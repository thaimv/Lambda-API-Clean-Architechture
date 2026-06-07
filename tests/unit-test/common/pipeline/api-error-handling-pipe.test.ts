/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

import { ERROR_MESSAGE, RESULT_CODE, STATUS_CODE } from '@/common/constants/response.const';
import { BaseError } from '@/common/errors/base-error';
import { InternalServerError } from '@/common/errors/internal-server-error';
import { ValidationError } from '@/common/errors/validation-error';
import { ApiErrorHandlingPipe } from '@/common/lambda/pipes/api-error-handling.pipe';
import type { ApiExecutionInput, ApiExecutionOutput } from '@/common/types/lambda.type';

// Mock dependencies
vi.mock('@/common/responses/api-error-response', () => ({
  ErrorResponse: {
    fromError: vi.fn((error) => ({
      json: {
        result: {
          code: error.code,
          message: error.message,
        },
      },
    })),
  },
}));

describe('ApiErrorHandlingPipe', () => {
  let pipe: ApiErrorHandlingPipe;
  let mockInput: ApiExecutionInput;
  let mockNext: (passable: ApiExecutionInput) => Promise<ApiExecutionOutput>;

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = new ApiErrorHandlingPipe();

    mockInput = {
      context: {
        identity: { sourceIp: '192.168.1.1' },
      },
      input: {
        httpMethod: 'POST',
        path: '/api/users',
      } as any,
    } as unknown as ApiExecutionInput;
  });

  describe('handle()', () => {
    it('should return result from next when no error occurs', async () => {
      const successOutput: ApiExecutionOutput = {
        output: { json: { result: { code: 0, message: 'Success' } } },
        error: undefined,
      } as any;

      mockNext = vi.fn(async () => successOutput);

      const result = await pipe.handle(mockInput, mockNext);

      expect(result).toEqual(successOutput);
      expect(mockNext).toHaveBeenCalledWith(mockInput);
    });

    it('should catch errors from next and return error response', async () => {
      const testError = new Error('Test error');
      mockNext = vi.fn(async () => {
        throw testError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(testError);
      expect(result.output).toBeDefined();
    });

    it('should handle ZodError and transform to ValidationError', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ]);

      mockNext = vi.fn(async () => {
        throw zodError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(zodError);
      expect(result.output).toBeDefined();
    });

    it('should handle BaseError and preserve its properties', async () => {
      const baseError = new BaseError(
        'Custom error message',
        RESULT_CODE.VALIDATION_BUSINESS_ERROR,
        STATUS_CODE.BAD_REQUEST,
      );

      mockNext = vi.fn(async () => {
        throw baseError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(baseError);
      expect(result.output).toBeDefined();
    });

    it('should handle generic Error', async () => {
      const genericError = new Error('Generic error');
      mockNext = vi.fn(async () => {
        throw genericError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(genericError);
      expect(result.output).toBeDefined();
    });

    it('should pass through to next function', async () => {
      mockNext = vi.fn(
        async () =>
          ({
            output: { json: { result: { code: 0 } } },
            error: undefined,
          }) as any,
      );

      await pipe.handle(mockInput, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockInput);
    });

    it('should call ErrorResponse.fromError with transformed error', async () => {
      const testError = new Error('Test error');
      mockNext = vi.fn(async () => {
        throw testError;
      });

      await pipe.handle(mockInput, mockNext);

      const { ErrorResponse } = await import('@/common/responses/api-error-response');
      const fromErrorMock = vi.mocked(ErrorResponse.fromError);

      expect(fromErrorMock).toHaveBeenCalledWith(expect.any(BaseError));
    });
  });

  describe('transformError()', () => {
    describe('ZodError transformation', () => {
      it('should transform ZodError to ValidationError', () => {
        const zodError = new ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['username'],
            message: 'Expected string, received number',
          },
        ]);

        const result = pipe.transformError(zodError);

        expect(result).toBeInstanceOf(ValidationError);
      });

      it('should include field errors from ZodError', () => {
        const zodError = new ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['email'],
            message: 'Expected string, received number',
          },
        ]);

        const result = pipe.transformError(zodError);

        expect(result).toBeInstanceOf(ValidationError);
        expect((result as ValidationError).details).toBeDefined();
      });

      it('should handle multiple ZodError validations', () => {
        const zodError = new ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['email'],
            message: 'Expected string, received number',
          },
          {
            code: 'too_small',
            type: 'string',
            minimum: 8,
            inclusive: true,
            path: ['password'],
            message: 'String must contain at least 8 character(s)',
          },
        ]);

        const result = pipe.transformError(zodError);

        expect(result).toBeInstanceOf(ValidationError);
      });
    });

    describe('BaseError transformation', () => {
      it('should return BaseError as-is', () => {
        const baseError = new BaseError(
          'Test message',
          RESULT_CODE.VALIDATION_BUSINESS_ERROR,
          STATUS_CODE.BAD_REQUEST,
        );

        const result = pipe.transformError(baseError);

        expect(result).toBe(baseError);
      });

      it('should preserve custom BaseError properties', () => {
        const customError = new BaseError('Custom error', 'CUSTOM_CODE', 400);
        customError.details = { custom: 'data' };

        const result = pipe.transformError(customError);

        expect(result.code).toBe('CUSTOM_CODE');
        expect(result.statusCode).toBe(400);
      });
    });

    describe('Generic Error transformation', () => {
      it('should transform generic Error to InternalServerError', () => {
        const error = new Error('Generic error');

        const result = pipe.transformError(error);

        expect(result).toBeInstanceOf(InternalServerError);
        expect(result.code).toBe(RESULT_CODE.INTERNAL_SERVER_ERROR);
        expect(result.statusCode).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      });

      it('should use INTERNAL_SERVER_ERROR for unknown errors', () => {
        const error = new Error('Unknown error');

        const result = pipe.transformError(error);

        expect(result).toBeInstanceOf(InternalServerError);
        expect(result.message).toBe(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
      });
    });
  });

  describe('error flow', () => {
    it('should handle error in pipeline without breaking execution', async () => {
      const testError = new Error('Pipe error');
      mockNext = vi.fn(async () => {
        throw testError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result).toBeDefined();
      expect(result.error).toBe(testError);
    });

    it('should handle async error in next pipe', async () => {
      mockNext = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toBeDefined();
    });

    it('should handle multiple sequential calls with different errors', async () => {
      // First call with error
      mockNext = vi.fn(async () => {
        throw new Error('Error 1');
      });

      const result1 = await pipe.handle(mockInput, mockNext);
      expect(result1.error).toBeDefined();

      // Second call with different error
      vi.clearAllMocks();
      mockNext = vi.fn(async () => {
        throw new Error('Error 2');
      });

      const result2 = await pipe.handle(mockInput, mockNext);
      expect(result2.error).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle null error gracefully', async () => {
      mockNext = vi.fn(async () => {
        throw null as any;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(null);
      expect(result.output).toBeDefined();
    });

    it('should handle error with empty message', async () => {
      const error = new Error('');
      mockNext = vi.fn(async () => {
        throw error;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toBe(error);
    });

    it('should handle validation error with no field errors', () => {
      const zodError = new ZodError([]);

      const result = pipe.transformError(zodError);

      expect(result).toBeInstanceOf(ValidationError);
    });

    it('should handle error with special characters in message', async () => {
      const error = new Error('Error with <special> & "characters"');
      mockNext = vi.fn(async () => {
        throw error;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toBe(error);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle validation error in user creation', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['email'],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['password'],
          message: 'Required',
        },
      ]);

      mockNext = vi.fn(async () => {
        throw zodError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(zodError);
      expect(result.output).toBeDefined();
    });

    it('should handle business logic error', async () => {
      const businessError = new BaseError('User already exists', 'USER_ALREADY_EXISTS', 409);

      mockNext = vi.fn(async () => {
        throw businessError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(businessError);
    });

    it('should handle database connection error', async () => {
      const dbError = new Error('Connection timeout');
      mockNext = vi.fn(async () => {
        throw dbError;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(result.error).toEqual(dbError);
      expect(result.output).toBeDefined();
    });

    it('should handle successful request execution after error handling', async () => {
      // First, set up error scenario
      mockNext = vi.fn(async () => {
        throw new Error('First error');
      });

      const errorResult = await pipe.handle(mockInput, mockNext);
      expect(errorResult.error).toBeDefined();

      // Then, set up successful scenario
      vi.clearAllMocks();
      mockNext = vi.fn(
        async () =>
          ({
            output: { json: { result: { code: 0, message: 'Success', data: {} } } },
            error: undefined,
          }) as any,
      );

      const successResult = await pipe.handle(mockInput, mockNext);
      expect(successResult.error).toBeUndefined();
    });
  });
});
