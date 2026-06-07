/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BaseError } from '@/common/errors/base-error';
import { ApiLoggingPipe } from '@/common/lambda/pipes/api-logging.pipe';
import { logger, primaryLogger } from '@/common/logger';
import type { ApiExecutionInput, ApiExecutionOutput } from '@/common/types/lambda.type';

// Mock the logger and string utility
vi.mock('@/common/logger');
vi.mock('@/common/utils/string.util', () => ({
  customParameterBody: vi.fn((input) => input),
}));

describe('ApiLoggingPipe', () => {
  let pipe: ApiLoggingPipe;
  let mockInput: ApiExecutionInput;
  let mockOutput: ApiExecutionOutput;
  let mockNext: (passable: ApiExecutionInput) => Promise<ApiExecutionOutput>;

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = new ApiLoggingPipe();

    // Setup mock input
    mockInput = {
      context: {
        identity: {
          sourceIp: '192.168.1.1',
        },
      },
      input: {
        httpMethod: 'POST',
        path: '/api/users',
        queryStringParameters: { page: '1' },
        pathParameters: { id: '123' },
        requestContext: {
          identity: { sourceIp: '192.168.1.1' },
          requestId: 'req-123',
        },
      } as any,
    } as unknown as ApiExecutionInput;

    // Setup mock output
    mockOutput = {
      output: {
        json: {
          result: {
            code: 0,
            message: 'Success',
            data: { id: '123' },
          },
        },
      },
      error: undefined,
    } as any;

    // Setup mock next function
    mockNext = vi.fn(async () => mockOutput);
  });

  describe('handle()', () => {
    it('should call logger.addContext with passable context', async () => {
      await pipe.handle(mockInput, mockNext);

      expect(logger.addContext).toHaveBeenCalledWith(mockInput.context);
    });

    it('should call next with the passable', async () => {
      await pipe.handle(mockInput, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockInput);
    });

    it('should log info on success', async () => {
      await pipe.handle(mockInput, mockNext);

      expect(primaryLogger.info).toHaveBeenCalled();
      const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
      const infoData = infoCall[1];

      expect(infoData.apiName).toBe('POST /api/users');
      expect(infoData.result.status).toBe('Success');
    });

    it('should log failure status when error exists', async () => {
      const errorOutput = {
        ...mockOutput,
        error: new Error('Test error'),
      };
      mockNext = vi.fn(async () => errorOutput);

      await pipe.handle(mockInput, mockNext);

      const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
      const infoData = infoCall[1];

      expect(infoData.result.status).toBe('Failure');
    });

    it('should include error details when error exists', async () => {
      const errorOutput = {
        ...mockOutput,
        error: new Error('Test error'),
      };
      mockNext = vi.fn(async () => errorOutput);

      await pipe.handle(mockInput, mockNext);

      const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
      const infoData = infoCall[1];

      expect(infoData.error).toBeDefined();
      expect(infoData.error.message).toBe('Test error');
    });

    it('should return the output from next', async () => {
      const result = await pipe.handle(mockInput, mockNext);

      expect(result).toEqual(mockOutput);
    });

    // it('should log request input details', async () => {
    //   await pipe.handle(mockInput, mockNext);

    //   const debugCall = vi.mocked(logger.debug).mock.calls[0];
    //   const debugData = debugCall[1];

    //   expect(debugData.input).toBeDefined();
    //   expect(debugData.input.queryStringParameters).toEqual({ page: '1' });
    //   expect(debugData.input.pathParameters).toEqual({ id: '123' });
    //   expect(debugData.input.apiGwRequestId).toBe('req-123');
    // });

    // it('should log response data', async () => {
    //   // The pipe gets data from apiRes.data, not apiRes.result.data
    //   mockOutput.output.json.data = { id: '123' };
    //   mockNext = vi.fn(async () => mockOutput);

    //   await pipe.handle(mockInput, mockNext);

    //   const debugCall = vi.mocked(logger.debug).mock.calls[0];
    //   const debugData = debugCall[1];

    //   expect(debugData.output).toEqual({ id: '123' });
    // });

    // it('should handle missing output data gracefully', async () => {
    //   const outputWithoutData = {
    //     output: {
    //       json: {
    //         result: {
    //           code: 0,
    //           message: 'Success',
    //         },
    //       },
    //     },
    //     error: undefined,
    //   } as any;
    //   mockNext = vi.fn(async () => outputWithoutData);

    //   await pipe.handle(mockInput, mockNext);

    //   const debugCall = vi.mocked(logger.debug).mock.calls[0];
    //   const debugData = debugCall[1];

    //   expect(debugData.output).toEqual({});
    // });

    it('should handle async operations in next pipe', async () => {
      let callCount = 0;
      mockNext = vi.fn(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return mockOutput;
      });

      const result = await pipe.handle(mockInput, mockNext);

      expect(callCount).toBe(1);
      expect(result).toEqual(mockOutput);
    });

    it('should propagate errors from next pipe', async () => {
      const testError = new Error('Pipe error');
      mockNext = vi.fn(async () => {
        throw testError;
      });

      await expect(pipe.handle(mockInput, mockNext)).rejects.toThrow('Pipe error');
    });

    it('should work with multiple sequential calls', async () => {
      await pipe.handle(mockInput, mockNext);
      await pipe.handle(mockInput, mockNext);

      expect(logger.addContext).toHaveBeenCalledTimes(4);
      expect(primaryLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle context with additional properties', async () => {
      const inputWithContext = {
        ...mockInput,
        context: {
          identity: { sourceIp: '192.168.1.1' },
          custom: { userId: '456' },
        },
      };

      await pipe.handle(inputWithContext, mockNext);

      expect(logger.addContext).toHaveBeenCalledWith(inputWithContext.context);
    });

    it('should handle result message in info log', async () => {
      await pipe.handle(mockInput, mockNext);

      const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
      expect(infoCall[0]).toBe('Success'); // Should be result.message
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        vi.clearAllMocks();
        mockInput.input.httpMethod = method;

        await pipe.handle(mockInput, mockNext);

        const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
        const infoData = infoCall[1];

        expect(infoData.apiName).toContain(method);
      }
    });

    it('should fallback to data.message when result.message is undefined', async () => {
      mockOutput.output.json = {
        result: { code: 0 },
        data: { message: 'Data message fallback' },
      };
      mockNext = vi.fn(async () => mockOutput);

      await pipe.handle(mockInput, mockNext);

      const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
      expect(infoCall[0]).toBe('Data message fallback');
    });

    it('should fallback to "No message" when both result.message and data.message are undefined', async () => {
      mockOutput.output.json = {
        result: { code: 0 },
        data: {},
      };
      mockNext = vi.fn(async () => mockOutput);

      await pipe.handle(mockInput, mockNext);

      const infoCall = vi.mocked(primaryLogger.info).mock.calls[0];
      expect(infoCall[0]).toBe('No message');
    });
  });
});
