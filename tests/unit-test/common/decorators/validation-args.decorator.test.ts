import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import { RouteName } from '@/common/constants/graphql-api.const';
import { ValidationArgs } from '@/common/decorators/validation-args.decorator';
import { ValidationError } from '@/common/errors/validation-error';
import type { TRequestEvent } from '@/common/types/event.type';

describe('ValidationArgs Decorator', () => {
  const mockSchema = z.object({
    name: z.string(),
    age: z.number().min(0),
  });

  const mockEvent: TRequestEvent<z.infer<typeof mockSchema>> = {
    arguments: { name: 'Alice', age: 25 },
    identity: {
      cognitoIdentityAuthProvider: 'mock-auth-provider',
      accountId: '',
      cognitoIdentityId: '',
      userArn: '',
      username: '',
    },
    field: RouteName.GET_HOME_NOTIFICATIONS,
  };

  it('should call the original method if validation passes', () => {
    class MockController {
      @ValidationArgs(mockSchema)
      public exampleMethod(event: TRequestEvent<z.infer<typeof mockSchema>>) {
        return 'Validation passed';
      }
    }

    const controller = new MockController();
    const result = controller.exampleMethod(mockEvent);
    expect(result).toBe('Validation passed');
  });

  it('should throw ValidationError if argument is missing', () => {
    class MockController {
      @ValidationArgs(mockSchema)
      public exampleMethod(event: TRequestEvent<unknown>) {}
    }

    const controller = new MockController();

    const invalidEvent = { ...mockEvent, arguments: undefined };

    expect(() => controller.exampleMethod(invalidEvent)).toThrowError(
      new ValidationError('Invalid event arguments'),
    );
  });

  it('should throw ValidationError if validation fails', () => {
    class MockController {
      @ValidationArgs(mockSchema)
      public exampleMethod(event: TRequestEvent<z.infer<typeof mockSchema>>) {}
    }

    const controller = new MockController();

    const invalidEvent = {
      ...mockEvent,
      arguments: { name: 'Alice', age: -5 }, // Invalid age, should be >= 0
    };

    expect(() => controller.exampleMethod(invalidEvent)).toThrowError(
      new ValidationError('Failed to validate age'),
    );
  });
});
