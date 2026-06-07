/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GraphQLLoggingPipe } from '@/common/lambda/pipes/graphql-logging.pipe';
import { primaryLogger, logger } from '@/common/logger';
import type { GraphQLExecutionInput, GraphQLExecutionOutput } from '@/common/types/lambda.type';

// Mock dependencies
vi.mock('@/common/logger');

let pipe: GraphQLLoggingPipe;
let mockInput: GraphQLExecutionInput;
let mockOutput: GraphQLExecutionOutput;
let mockNext: (passable: GraphQLExecutionInput) => Promise<GraphQLExecutionOutput>;

function setupPipe(): void {
  vi.clearAllMocks();
  pipe = new GraphQLLoggingPipe();

  mockInput = {
    input: {
      field: 'getUserById',
    } as any,
    context: {
      requestId: 'req-123',
    } as any,
  };

  mockOutput = {
    output: {
      result: {
        message: 'GraphQL execution successful',
        code: 'SC-001',
        data: { user: { id: '1', name: 'John' } },
      },
    },
    error: undefined,
  };

  mockNext = vi.fn(async () => mockOutput);
}

describe('GraphQLLoggingPipe', () => {
  beforeEach(() => {
    setupPipe();
  });

  it('should call primaryLogger.addContext with passable context', async () => {
    await pipe.handle(mockInput, mockNext);
    expect(primaryLogger.addContext).toHaveBeenCalledWith(mockInput.context);
    expect(logger.addContext).toHaveBeenCalledWith(mockInput.context);
  });

  it('should call next with the passable', async () => {
    await pipe.handle(mockInput, mockNext);
    expect(mockNext).toHaveBeenCalledWith(mockInput);
  });

  it('should return the output from next', async () => {
    const result = await pipe.handle(mockInput, mockNext);
    expect(result).toEqual(mockOutput);
  });

  it('should log info with result message', async () => {
    await pipe.handle(mockInput, mockNext);
    expect(primaryLogger.info).toHaveBeenCalled();
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBe('GraphQL execution successful');
  });

  it('should log with correct API name', async () => {
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    const infoData = infoCall[1] as any;
    expect(infoData.apiName).toBe('getUserById');
  });

  it('should log success status when no error', async () => {
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    const infoData = infoCall[1] as any;
    expect(infoData.result.status).toBe('Success');
  });

  it('should include input and output in log', async () => {
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    const infoData = infoCall[1] as any;
    expect(infoData.input).toEqual(mockInput.input.arguments);
    expect(infoData.output).toEqual(mockOutput.output);
  });

  it('should handle undefined context gracefully', async () => {
    const inputWithoutContext = { ...mockInput, context: undefined };
    await pipe.handle(inputWithoutContext, mockNext);
    expect(primaryLogger.addContext).not.toHaveBeenCalled();
  });

  it('should handle output without result property', async () => {
    const outputWithoutResult = { output: { data: { user: { id: '1' } } }, error: undefined };
    mockNext = vi.fn(async () => outputWithoutResult);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBeDefined();
  });

  it('should handle output without result.message property', async () => {
    const outputWithoutMessage = {
      output: { result: { code: 'SC-001', data: { user: { id: '1' } } } },
      error: undefined,
    };
    mockNext = vi.fn(async () => outputWithoutMessage);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBeDefined();
  });

  it('should use error message when no result message available', async () => {
    const errorOutput = { output: { data: {} }, error: new Error('GraphQL error') };
    mockNext = vi.fn(async () => errorOutput);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBe('GraphQL error');
  });

  it('should use default message when no message found anywhere', async () => {
    const emptyOutput = { output: {}, error: undefined };
    mockNext = vi.fn(async () => emptyOutput);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBe('GraphQL Execution');
  });

  it('should log failure status when error exists', async () => {
    const errorOutput = {
      output: { result: { message: 'Error occurred', code: 'SC-001' } },
      error: new Error('Test error'),
    };
    mockNext = vi.fn(async () => errorOutput);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    const infoData = infoCall[1] as any;
    expect(infoData.result.status).toBe('Failure');
    expect(infoData.error).toBeDefined();
  });

  it('should include error details in log', async () => {
    const testError = new Error('Test error');
    const errorOutput = { output: { result: { message: 'Error' } }, error: testError };
    mockNext = vi.fn(async () => errorOutput);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    const infoData = infoCall[1] as any;
    expect(infoData.error.message).toBe('Test error');
    expect(infoData.error.trace).toBeDefined();
  });

  it('should handle async error in next pipe', async () => {
    mockNext = vi.fn(async () => {
      throw new Error('Async error');
    });
    await expect(pipe.handle(mockInput, mockNext)).rejects.toThrow('Async error');
  });

  it('should handle null output', async () => {
    const nullOutput = { output: null, error: undefined };
    mockNext = vi.fn(async () => nullOutput as any);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBe('GraphQL Execution');
  });

  it('should handle typical GraphQL query execution', async () => {
    const queryOutput = {
      output: {
        result: {
          message: 'User query executed successfully',
          code: 'SC-001',
          data: { user: { id: '123', name: 'John Doe', email: 'john@example.com' } },
        },
      },
      error: undefined,
    };
    mockNext = vi.fn(async () => queryOutput);
    const result = await pipe.handle(mockInput, mockNext);
    expect(result).toEqual(queryOutput);
    expect(primaryLogger.info).toHaveBeenCalled();
  });

  it('should handle GraphQL mutation error', async () => {
    const mutationError = new Error('User already exists');
    const errorOutput = {
      output: {
        result: {
          message: 'Mutation failed',
          code: 'ERR-USER-EXISTS',
          error: { code: 'USER_ALREADY_EXISTS' },
        },
      },
      error: mutationError,
    };
    mockNext = vi.fn(async () => errorOutput);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    const infoData = infoCall[1] as any;
    expect(infoData.result.status).toBe('Failure');
    expect(infoData.error.message).toBe('User already exists');
  });

  it('should handle subscription output', async () => {
    const subscriptionOutput = {
      output: {
        result: {
          message: 'Subscription initialized',
          code: 'SC-SUBSCRIPTION',
          subscription: { channel: 'user-updates' },
        },
      },
      error: undefined,
    };
    mockNext = vi.fn(async () => subscriptionOutput);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBe('Subscription initialized');
  });

  it('should handle deeply nested output structure', async () => {
    const deepOutput = {
      output: {
        data: { user: { profile: { details: { nested: 'value' } } } },
        result: { message: 'Deep query successful' },
      },
      error: undefined,
    };
    mockNext = vi.fn(async () => deepOutput);
    await pipe.handle(mockInput, mockNext);
    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBe('Deep query successful');
  });

  // it('should handle field name with special characters', async () => {
  //   mockInput.input.field = 'getUserById_v2';
  //   await pipe.handle(mockInput, mockNext);
  //   const debugCall = vi.mocked(primaryLogger.debug).mock.calls[0];
  //   const debugData = debugCall[1];
  //   expect(debugData.apiName).toBe('getUserById_v2');
  // });
});
