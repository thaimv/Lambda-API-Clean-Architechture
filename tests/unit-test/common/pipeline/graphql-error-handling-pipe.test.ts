import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RESULT_CODE, ERROR_MESSAGE, STATUS_CODE } from '@/common/constants/response.const';
import { BaseError } from '@/common/errors/base-error';
import { InternalServerError } from '@/common/errors/internal-server-error';
import { GraphQLErrorHandlingPipe } from '@/common/lambda/pipes/graphql-error-handling.pipe';
import type { GraphQLExecutionInput, GraphQLExecutionOutput } from '@/common/types/lambda.type';

// Mock BaseError.toCustomError()
vi.mock('@/common/errors/base-error', async () => {
  const actual = await vi.importActual('@/common/errors/base-error');
  return actual;
});

let pipe: GraphQLErrorHandlingPipe;
let mockInput: GraphQLExecutionInput;
let mockNext: (passable: GraphQLExecutionInput) => Promise<GraphQLExecutionOutput>;

function setupPipe(): void {
  vi.clearAllMocks();
  pipe = new GraphQLErrorHandlingPipe();

  mockInput = {
    input: {
      field: 'getUserById',
    } as any,
  };
}

describe('GraphQLErrorHandlingPipe', () => {
  beforeEach(() => {
    setupPipe();
  });

  it('should return result from next when no error occurs', async () => {
    const successOutput: GraphQLExecutionOutput = {
      output: {
        result: {
          message: 'Success',
          data: { user: { id: '1' } },
        },
      },
      error: undefined,
    };

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

  it('should handle BaseError and return custom error output', async () => {
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
          output: { result: { message: 'Success' } },
          error: undefined,
        }) as any,
    );

    await pipe.handle(mockInput, mockNext);
    expect(mockNext).toHaveBeenCalledWith(mockInput);
  });

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
    const result = pipe.transformError(customError);
    expect(result.code).toBe('CUSTOM_CODE');
    expect(result.statusCode).toBe(400);
    expect(result.message).toBe('Custom error');
  });

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
    mockNext = vi.fn(async () => {
      throw new Error('Error 1');
    });

    const result1 = await pipe.handle(mockInput, mockNext);
    expect(result1.error).toBeDefined();

    vi.clearAllMocks();
    mockNext = vi.fn(async () => {
      throw new Error('Error 2');
    });

    const result2 = await pipe.handle(mockInput, mockNext);
    expect(result2.error).toBeDefined();
  });

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

  it('should handle nested error objects', async () => {
    const nestedError = new Error('Nested error');
    (nestedError as any).originalError = new Error('Original cause');

    mockNext = vi.fn(async () => {
      throw nestedError;
    });

    const result = await pipe.handle(mockInput, mockNext);
    expect(result.error).toBe(nestedError);
  });

  it('should handle GraphQL validation error', async () => {
    const validationError = new BaseError('Invalid query', 'GRAPHQL_VALIDATION_ERROR', 400);

    mockNext = vi.fn(async () => {
      throw validationError;
    });

    const result = await pipe.handle(mockInput, mockNext);
    expect(result.error).toEqual(validationError);
    expect(result.output).toBeDefined();
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

  it('should handle authorization error', async () => {
    const authError = new BaseError('Unauthorized access', 'UNAUTHORIZED', 401);

    mockNext = vi.fn(async () => {
      throw authError;
    });

    const result = await pipe.handle(mockInput, mockNext);
    expect(result.error).toEqual(authError);
  });

  it('should handle rate limiting error', async () => {
    const rateLimitError = new BaseError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);

    mockNext = vi.fn(async () => {
      throw rateLimitError;
    });

    const result = await pipe.handle(mockInput, mockNext);
    expect(result.error).toEqual(rateLimitError);
  });

  it('should handle successful request after error handling', async () => {
    mockNext = vi.fn(async () => {
      throw new Error('First error');
    });

    const errorResult = await pipe.handle(mockInput, mockNext);
    expect(errorResult.error).toBeDefined();

    vi.clearAllMocks();
    mockNext = vi.fn(
      async () =>
        ({
          output: { result: { message: 'Success', data: { id: '123' } } },
          error: undefined,
        }) as any,
    );

    const successResult = await pipe.handle(mockInput, mockNext);
    expect(successResult.error).toBeUndefined();
  });
});
