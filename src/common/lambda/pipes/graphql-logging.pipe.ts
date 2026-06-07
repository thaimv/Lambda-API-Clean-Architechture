import type { NextFunction } from '@/common/lambda/pipeline';
import { logger, primaryLogger } from '@/common/logger';
import type { GraphQLExecutionInput, GraphQLExecutionOutput } from '@/common/types/lambda.type';

/**
 * Pipe that logs the input and output of a GraphQL execution according to the standardized format
 */
export class GraphQLLoggingPipe {
  async handle(
    passable: GraphQLExecutionInput,
    next: NextFunction<GraphQLExecutionInput, GraphQLExecutionOutput>,
  ): Promise<GraphQLExecutionOutput> {
    if (passable.context) {
      logger.addContext(passable.context);
      primaryLogger.addContext(passable.context);
    }

    const res = await next(passable);
    const error = res.error;
    const resultMessage = res.output?.result?.message ?? (error?.message || 'GraphQL Execution');

    primaryLogger.info(resultMessage, {
      apiName: passable.input.field,
      result: {
        status: error ? 'Failure' : 'Success',
        message: error ? error.message : 'Success',
      },
      input: passable.input.arguments,
      output: res.output,
      error: error ? { message: error.message, trace: error.stack } : undefined,
    });

    return res;
  }
}
