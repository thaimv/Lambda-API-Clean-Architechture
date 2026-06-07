import { type z, type ZodSchema } from 'zod';

import { ValidationError } from '@/common/errors/validation-error';
import type { TRequestEvent } from '@/common/types/event.type';

/**
 * Decorator to validate the arguments of a controller method.
 */
export function ValidationArgs(schema: ZodSchema) {
  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (event: TRequestEvent<z.infer<typeof schema>>, ...args: unknown[]) {
      if (!event || !event.arguments) {
        throw new ValidationError('Invalid event arguments');
      }

      const validationResult = schema.safeParse(event.arguments);
      if (!validationResult.success) {
        const errorFields = validationResult.error?.issues.flatMap((i) => i.path).join(', ');

        throw new ValidationError(`Failed to validate ${errorFields}`);
      }

      return originalMethod.apply(this, [
        {
          ...event,
          arguments: validationResult.data,
        },
        ...args,
      ]);
    };

    return descriptor;
  };
}
