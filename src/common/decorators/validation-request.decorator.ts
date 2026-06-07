import { type ZodSchema } from 'zod';

import { ValidationError } from '@/common/errors/validation-error';
import { logger } from '@/common/logger';
import type { TApiGatewayCustomEvent } from '@/common/types/event.type';

type TRestApiRequestField = keyof TApiGatewayCustomEvent<unknown>;

/**
 * Decorator to validate the arguments of a controller method.
 */
export function ValidationRequest(schema: ZodSchema, field: TRestApiRequestField = 'body') {
  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (event: TApiGatewayCustomEvent<unknown>, ...args: unknown[]) {
      logger.debug('ValidationRequest', { field });

      if (!event || !event[field]) {
        throw new ValidationError(`Invalid event ${field}`);
      }

      const validationResult = schema.safeParse(event[field]);

      if (!validationResult.success) {
        const errorFields = validationResult.error?.issues
          .flatMap((i) => `${i.path} - ${i.message}`)
          .join(', ');

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
