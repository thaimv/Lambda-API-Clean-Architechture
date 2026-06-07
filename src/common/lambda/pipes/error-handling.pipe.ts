import { ZodError } from 'zod';

import { ERROR_MESSAGE } from '@/common/constants/response.const';
import { BaseError } from '@/common/errors/base-error';
import { InternalServerError } from '@/common/errors/internal-server-error';
import { ValidationError } from '@/common/errors/validation-error';
import type { NextFunction } from '@/common/lambda/pipeline';
import { ErrorResponse } from '@/common/responses/api-error-response';

/**
 * Pipe that handles errors during Lambda execution (REST and GraphQL).
 */
export class ErrorHandlingPipe<TPassable, TOutput> {
  async handle(passable: TPassable, next: NextFunction<TPassable, TOutput>): Promise<TOutput> {
    try {
      return await next(passable);
    } catch (error) {
      const appError = this.transformError(error as Error);

      return {
        output: ErrorResponse.fromError(appError),
        error: error as Error,
      } as TOutput;
    }
  }

  transformError(error: Error): BaseError {
    if (error instanceof ZodError) {
      const errorFields = error.issues.map((e) => `${e.path} - ${e.message}`).join(', ');

      return new ValidationError(`Failed to validate: ${errorFields}`, error.flatten().fieldErrors);
    }

    if (error instanceof BaseError) {
      return error;
    }

    return new InternalServerError(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  }
}
