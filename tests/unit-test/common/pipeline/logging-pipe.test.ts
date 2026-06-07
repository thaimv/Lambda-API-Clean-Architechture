/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/common/errors/notfound-error';
import { createApiLoggingPipe, createGraphQLLoggingPipe } from '@/common/lambda/pipes/logging.pipe';
import { logger, primaryLogger } from '@/common/logger';
import { ErrorResponse } from '@/common/responses/api-error-response';
import type {
  ApiExecutionInput,
  ApiExecutionOutput,
  GraphQLExecutionInput,
  GraphQLExecutionOutput,
} from '@/common/types/lambda.type';

vi.mock('@/common/logger');

describe('LoggingPipe (REST)', () => {
  let pipe: ReturnType<typeof createApiLoggingPipe>;
  let mockInput: ApiExecutionInput;
  let mockOutput: ApiExecutionOutput;
  let mockNext: (passable: ApiExecutionInput) => Promise<ApiExecutionOutput>;

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = createApiLoggingPipe();

    mockInput = {
      context: { identity: { sourceIp: '192.168.1.1' } } as any,
      input: {
        httpMethod: 'POST',
        path: '/api/users',
        body: JSON.stringify({ name: 'demo' }),
        queryStringParameters: { page: '1' },
        pathParameters: { id: '123' },
        headers: { Authorization: 'secret-token' },
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any,
    } as unknown as ApiExecutionInput;

    mockOutput = {
      output: {
        json: {
          result: { code: 0, message: 'Success' },
          data: { id: '123' },
        },
      },
      error: undefined,
    } as any;

    mockNext = vi.fn(async () => mockOutput);
  });

  it('should add context and log REST api name', async () => {
    await pipe.handle(mockInput, mockNext);

    expect(logger.addContext).toHaveBeenCalledWith(mockInput.context);
    const infoData = vi.mocked(primaryLogger.info).mock.calls[0][1] as any;
    expect(infoData.apiName).toBe('POST /api/users');
    expect(infoData.result.status).toBe('Success');
    expect(infoData.output).toEqual({ id: '123' });
    expect(infoData.input).toEqual({
      body: { name: 'demo' },
      queryStringParameters: { page: '1' },
      pathParameters: { id: '123' },
    });
    expect(infoData.input).not.toHaveProperty('headers');
    expect(infoData.input).not.toHaveProperty('requestContext');
  });

  it('should fallback to data.message when result.message is undefined', async () => {
    mockOutput.output.json = {
      result: { code: 0 },
      data: { message: 'Data message fallback' },
    };
    mockNext = vi.fn(async () => mockOutput);

    await pipe.handle(mockInput, mockNext);

    expect(vi.mocked(primaryLogger.info).mock.calls[0][0]).toBe('Data message fallback');
  });

  it('should log failure when error exists', async () => {
    mockNext = vi.fn(async () => ({ ...mockOutput, error: new Error('Test error') }));

    await pipe.handle(mockInput, mockNext);

    const infoData = vi.mocked(primaryLogger.info).mock.calls[0][1] as any;
    expect(infoData.result.status).toBe('Failure');
    expect(infoData.error.message).toBe('Test error');
  });

  it('should log error body in output when REST response is an error response', async () => {
    const errorBody = {
      result: { code: 'EB-001', message: 'Unauthorized' },
      error: { error_message: 'Unauthorized', error_detail: null },
    };
    mockNext = vi.fn(async () => ({
      output: { json: errorBody },
      error: new Error('Unauthorized'),
    }));

    await pipe.handle(mockInput, mockNext);

    const infoData = vi.mocked(primaryLogger.info).mock.calls[0][1] as any;
    expect(infoData.output).toEqual(errorBody.error);
    expect(infoData.result.status).toBe('Failure');
  });

  it('should fallback to "No message" when result and data messages are missing', async () => {
    mockOutput.output.json = {
      result: { code: 0 },
      data: {},
    };
    mockNext = vi.fn(async () => mockOutput);

    await pipe.handle(mockInput, mockNext);

    expect(vi.mocked(primaryLogger.info).mock.calls[0][0]).toBe('No message');
  });
});

describe('LoggingPipe (GraphQL)', () => {
  let pipe: ReturnType<typeof createGraphQLLoggingPipe>;
  let mockInput: GraphQLExecutionInput;
  let mockOutput: GraphQLExecutionOutput;
  let mockNext: (passable: GraphQLExecutionInput) => Promise<GraphQLExecutionOutput>;

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = createGraphQLLoggingPipe();

    mockInput = {
      input: { field: 'createUserInfo', arguments: { userNickname: 'demo' } } as any,
      context: { requestId: 'req-123' } as any,
    };

    mockOutput = {
      output: {
        gigyaUuid: 'user-1',
        userNickname: 'John',
        cognitoId: null,
      },
      error: undefined,
    };

    mockNext = vi.fn(async () => mockOutput);
  });

  it('should add context and log GraphQL field name', async () => {
    await pipe.handle(mockInput, mockNext);

    expect(primaryLogger.addContext).toHaveBeenCalledWith(mockInput.context);
    const infoData = vi.mocked(primaryLogger.info).mock.calls[0][1] as any;
    expect(infoData.apiName).toBe('createUserInfo');
    expect(infoData.input).toEqual({ userNickname: 'demo' });
    expect(infoData.output).toEqual(mockOutput.output);
  });

  it('should skip addContext when context is undefined', async () => {
    await pipe.handle({ ...mockInput, context: undefined }, mockNext);

    expect(primaryLogger.addContext).not.toHaveBeenCalled();
  });

  it('should use default message for plain success payload', async () => {
    await pipe.handle(mockInput, mockNext);

    expect(vi.mocked(primaryLogger.info).mock.calls[0][0]).toBe('GraphQL Execution');
  });

  it('should use error message when execution fails', async () => {
    mockNext = vi.fn(async () => ({
      output: {},
      error: new Error('GraphQL error'),
    }));

    await pipe.handle(mockInput, mockNext);

    expect(vi.mocked(primaryLogger.info).mock.calls[0][0]).toBe('GraphQL error');
  });

  it('should log ErrorResponse body when GraphQL output is an error response', async () => {
    const errorOutput = ErrorResponse.fromError(new NotFoundError('User not found'));
    mockNext = vi.fn(async () => ({
      output: errorOutput,
      error: new NotFoundError('User not found'),
    }));

    await pipe.handle(mockInput, mockNext);

    const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
    expect(infoCall[0]).toBe('User not found');
    const infoData = infoCall[1] as any;
    expect(infoData.output).toEqual(errorOutput.json);
    expect(infoData.result.status).toBe('Failure');
  });
});
