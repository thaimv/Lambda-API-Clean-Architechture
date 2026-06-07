import type { Context } from 'aws-lambda';

import type { NextFunction } from '@/common/lambda/pipeline';
import { logger, primaryLogger } from '@/common/logger';
import {
  isGraphQLErrorOutput,
  type ApiExecutionInput,
  type ApiExecutionOutput,
  type GraphQLExecutionInput,
  type GraphQLExecutionOutput,
} from '@/common/types/lambda.type';
import { getApiRequestLogInput } from '@/common/utils/api-request.util';

type PipeResult = {
  output: unknown;
  error?: Error;
};

export type LoggingPipeOptions<TPassable, TResult extends PipeResult> = {
  getContext: (passable: TPassable) => Context | undefined;
  getApiName: (passable: TPassable) => string;
  getLogInput: (passable: TPassable) => unknown;
  getResultMessage: (passable: TPassable, result: TResult) => string;
  getLogOutput: (result: TResult) => unknown;
};

/**
 * Pipe that logs Lambda execution input/output for REST and GraphQL stacks.
 */
export class LoggingPipe<TPassable, TResult extends PipeResult> {
  constructor(private readonly options: LoggingPipeOptions<TPassable, TResult>) {}

  async handle(passable: TPassable, next: NextFunction<TPassable, TResult>): Promise<TResult> {
    const context = this.options.getContext(passable);
    if (context) {
      logger.addContext(context);
      primaryLogger.addContext(context);
    }

    const res = await next(passable);
    const resultMessage = this.options.getResultMessage(passable, res);

    primaryLogger.info(resultMessage, {
      apiName: this.options.getApiName(passable),
      result: {
        status: res.error ? 'Failure' : 'Success',
        message: resultMessage,
      },
      input: this.options.getLogInput(passable),
      output: this.options.getLogOutput(res),
      error: res.error ? { message: res.error.message, trace: res.error.stack } : undefined,
    });

    return res;
  }
}

const apiLoggingOptions: LoggingPipeOptions<ApiExecutionInput, ApiExecutionOutput> = {
  getContext: (passable) => passable.context,
  getApiName: (passable) => `${passable.input.httpMethod} ${passable.input.path}`,
  getLogInput: (passable) => getApiRequestLogInput(passable.input),
  getResultMessage: (_passable, result) => {
    const apiRes = result.output.json;
    return apiRes.result?.message || (apiRes.data as { message?: string })?.message || 'No message';
  },
  getLogOutput: (result) => {
    const json = result.output.json;
    return json.data ?? json.error;
  },
};

const graphQLLoggingOptions: LoggingPipeOptions<GraphQLExecutionInput, GraphQLExecutionOutput> = {
  getContext: (passable) => passable.context,
  getApiName: (passable) => passable.input.field,
  getLogInput: (passable) => passable.input.arguments,
  getResultMessage: (_passable, result) => {
    const errorBody = isGraphQLErrorOutput(result.output) ? result.output.json : undefined;
    return errorBody?.result?.message ?? result.error?.message ?? 'GraphQL Execution';
  },
  getLogOutput: (result) =>
    isGraphQLErrorOutput(result.output) ? result.output.json : result.output,
};

export const createApiLoggingPipe = () =>
  new LoggingPipe<ApiExecutionInput, ApiExecutionOutput>(apiLoggingOptions);

export const createGraphQLLoggingPipe = () =>
  new LoggingPipe<GraphQLExecutionInput, GraphQLExecutionOutput>(graphQLLoggingOptions);
