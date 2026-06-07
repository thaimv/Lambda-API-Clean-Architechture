import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Lambda } from '@/common/lambda/lambda';
import { ApiGWResponse } from '@/common/responses/api-response';
import { SuccessResponse } from '@/common/responses/api-success-response';

vi.mock('@/common/lambda/pipes/logging.pipe', () => ({
  createApiLoggingPipe: vi.fn().mockImplementation(() => ({
    handle: vi.fn(async (passable, next) => next(passable)),
  })),
}));

vi.mock('@/common/lambda/pipes/error-handling.pipe', () => ({
  ErrorHandlingPipe: vi.fn().mockImplementation(() => ({
    handle: vi.fn(async (passable, next) => next(passable)),
  })),
}));

describe('Lambda', () => {
  let mockHandler: ReturnType<typeof vi.fn>;
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHandler = vi.fn().mockResolvedValue({ success: true, data: { id: '123' } });

    mockEvent = {
      httpMethod: 'GET',
      path: '/api/test',
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      body: null,
      requestContext: {
        requestId: 'req-123',
        identity: { sourceIp: '192.168.1.1' },
      },
    } as unknown as APIGatewayProxyEvent;

    mockContext = {
      functionName: 'test-function',
      awsRequestId: 'aws-req-123',
      getRemainingTimeInMillis: () => 5000,
    } as unknown as Context;
  });

  describe('constructor', () => {
    it('should create handler with default pipes', () => {
      const lambda = new Lambda(mockHandler);
      expect(lambda).toBeInstanceOf(Lambda);
    });

    it('should create handler with custom pipes', () => {
      const customPipe = {
        handle: vi.fn(async (passable, next) => next(passable)),
      };
      const lambda = new Lambda(mockHandler, [customPipe]);
      expect(lambda).toBeInstanceOf(Lambda);
    });
  });

  describe('createHandler', () => {
    it('should return a function', () => {
      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();
      expect(typeof apiHandler).toBe('function');
    });

    it('should invoke handler with input event and context', async () => {
      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      await apiHandler(mockEvent, mockContext, () => {});

      expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext);
    });

    it('should return proper API Gateway response structure', async () => {
      const mockSuccessResponse = new SuccessResponse({
        data: { id: '123', name: 'Test' },
      });

      mockHandler.mockResolvedValue(mockSuccessResponse);

      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      const result = await apiHandler(mockEvent, mockContext, () => {});

      expect(result).toBeDefined();
      expect(result.statusCode).toBeDefined();
      expect(result.body).toBeDefined();
    });

    it('should wrap non-ApiGWResponse data with SuccessResponse', async () => {
      const plainData = { id: '123', name: 'Test' };
      mockHandler.mockResolvedValue(plainData);

      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      const result = await apiHandler(mockEvent, mockContext, () => {});

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
    });

    it('should pass through ApiGWResponse directly', async () => {
      const mockApiGWResponse = {
        statusCode: 201,
        body: JSON.stringify({ success: true }),
        headers: { 'Content-Type': 'application/json' },
        json: { success: true },
      };

      const apiGWResponseMock = Object.create(ApiGWResponse.prototype);
      Object.assign(apiGWResponseMock, mockApiGWResponse);

      mockHandler.mockResolvedValue(apiGWResponseMock);

      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      const result = await apiHandler(mockEvent, mockContext, () => {});

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(201);
    });

    it('should execute pipeline with correct input structure', async () => {
      const customPipe = {
        handle: vi.fn(async (passable, next) => {
          expect(passable.input).toBe(mockEvent);
          expect(passable.context).toBe(mockContext);
          return next(passable);
        }),
      };

      const lambda = new Lambda(mockHandler, [customPipe]);
      const apiHandler = lambda.createHandler();

      await apiHandler(mockEvent, mockContext, () => {});

      expect(customPipe.handle).toHaveBeenCalled();
    });

    it('should exclude json property from final response', async () => {
      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      const result = await apiHandler(mockEvent, mockContext, () => {});

      expect(result).not.toHaveProperty('json');
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        mockEvent.httpMethod = method;
        const lambda = new Lambda(mockHandler);
        const apiHandler = lambda.createHandler();

        const result = await apiHandler(mockEvent, mockContext, () => {});

        expect(result).toBeDefined();
      }
    });

    it('should handle request with body', async () => {
      mockEvent.body = JSON.stringify({ name: 'Test', value: 123 });
      mockEvent.httpMethod = 'POST';

      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      const result = await apiHandler(mockEvent, mockContext, () => {});

      expect(result).toBeDefined();
      expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext);
    });

    it('should handle request with path parameters', async () => {
      mockEvent.pathParameters = { id: '456' };

      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      const result = await apiHandler(mockEvent, mockContext, () => {});

      expect(result).toBeDefined();
    });

    it('should handle request with query string parameters', async () => {
      mockEvent.queryStringParameters = { page: '1', limit: '10' };

      const lambda = new Lambda(mockHandler);
      const apiHandler = lambda.createHandler();

      const result = await apiHandler(mockEvent, mockContext, () => {});

      expect(result).toBeDefined();
    });

    it('should process multiple pipes in sequence', async () => {
      const callOrder: string[] = [];

      const pipe1 = {
        handle: vi.fn(async (passable, next) => {
          callOrder.push('pipe1-start');
          const result = await next(passable);
          callOrder.push('pipe1-end');
          return result;
        }),
      };

      const pipe2 = {
        handle: vi.fn(async (passable, next) => {
          callOrder.push('pipe2-start');
          const result = await next(passable);
          callOrder.push('pipe2-end');
          return result;
        }),
      };

      const lambda = new Lambda(mockHandler, [pipe1, pipe2]);
      const apiHandler = lambda.createHandler();

      await apiHandler(mockEvent, mockContext, () => {});

      expect(callOrder).toEqual(['pipe1-start', 'pipe2-start', 'pipe2-end', 'pipe1-end']);
    });
  });
});
