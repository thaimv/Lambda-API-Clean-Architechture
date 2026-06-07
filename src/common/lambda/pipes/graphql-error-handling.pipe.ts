import { ERROR_MESSAGE } from '@/common/constants/response.const';
import { BaseError } from '@/common/errors/base-error';
import { InternalServerError } from '@/common/errors/internal-server-error';
import type { NextFunction } from '@/common/lambda/pipeline';
import type { GraphQLExecutionInput, GraphQLExecutionOutput } from '@/common/types/lambda.type';

/**
 * Pipe that handles errors during GraphQL execution
 */
export class GraphQLErrorHandlingPipe {
  async handle(
    passable: GraphQLExecutionInput,
    next: NextFunction<GraphQLExecutionInput, GraphQLExecutionOutput>,
  ): Promise<GraphQLExecutionOutput> {
    try {
      return await next(passable);
    } catch (error) {
      const appError = this.transformError(error as Error);

      return {
        output: appError.toCustomError(),
        error: error as Error,
      };
    }
  }

  transformError(error: Error): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    return new InternalServerError(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  }
}
