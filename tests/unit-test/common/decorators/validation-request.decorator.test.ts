import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

import { ValidationRequest } from '@/common/decorators/validation-request.decorator';
import { ValidationError } from '@/common/errors/validation-error';
import type { TApiGatewayCustomEvent } from '@/common/types/event.type';

describe('ValidationRequest Decorator', () => {
  const mockSchema = z.object({
    name: z.string(),
    age: z.number().min(0),
  });

  const mockEvent: TApiGatewayCustomEvent<unknown> = {
    body: { name: 'John', age: 30 },
    queryStringParameters: null,
    pathParameters: null,
    resource: '',
    path: '',
    authUser: { userId: 'mock-user-id' },
    headers: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
  };

  it('should call the original method if validation passes', () => {
    class MockController {
      @ValidationRequest(mockSchema)
      public exampleMethod(event: TApiGatewayCustomEvent<unknown>) {
        return 'Validation passed';
      }
    }

    const controller = new MockController();
    const result = controller.exampleMethod(mockEvent);
    expect(result).toBe('Validation passed');
  });

  it('should throw ValidationError if event field is missing', () => {
    class MockController {
      @ValidationRequest(mockSchema)
      public exampleMethod(event: TApiGatewayCustomEvent<unknown>) {}
    }

    const controller = new MockController();

    const invalidEvent = { ...mockEvent, body: undefined };

    expect(() => controller.exampleMethod(invalidEvent)).toThrowError(
      new ValidationError('Invalid event body'),
    );
  });

  it('should throw ValidationError if validation fails', () => {
    class MockController {
      @ValidationRequest(mockSchema)
      public exampleMethod(event: TApiGatewayCustomEvent<unknown>) {}
    }

    const controller = new MockController();

    const invalidEvent = {
      ...mockEvent,
      body: { name: 'John', age: -5 }, // Invalid age, should be >= 0
    };

    expect(() => controller.exampleMethod(invalidEvent)).toThrowError(
      new ValidationError('Failed to validate age - Number must be greater than or equal to 0'),
    );
  });
});
