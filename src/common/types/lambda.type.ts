import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

import type { ApiGWResponse } from '@/common/responses/api-response';
import type { TRequestEvent } from '@/common/types/event.type';
import type { ErrorResponseBody, SuccessResponseBody } from '@/common/types/response.type';

/**
 * @type LambdaHandler
 * @description Lambda handler type for Lambda class
 */
export type LambdaHandler<TInput, TOutput = void> = (
  input: TInput,
  context: Context,
) => Promise<TOutput>;

export type LambdaExecutionInput<TInput> = {
  input: TInput;
  context: Context;
};

export type GraphQLErrorOutputBody = ErrorResponseBody<unknown>;

export type GraphQLErrorOutput = ApiGWResponse<GraphQLErrorOutputBody>;

export type GraphQLExecutionInput<TArguments = unknown> = {
  input: TRequestEvent<TArguments>;
  context?: Context;
};

export type GraphQLExecutionOutput<TData = unknown> = {
  output: TData | GraphQLErrorOutput;
  error?: Error;
};

export type GraphQLHandlerResult<TData = unknown> = TData | GraphQLErrorOutput;

export const isGraphQLErrorOutput = (output: unknown): output is GraphQLErrorOutput => {
  if (!output || typeof output !== 'object' || !('json' in output)) {
    return false;
  }

  const json = (output as GraphQLErrorOutput).json;
  return Boolean(json?.error?.error_message);
};

export type ApiExecutionInput = LambdaExecutionInput<APIGatewayProxyEvent>;

export type ApiExecutionOutput = {
  output: ApiGWResponse<{
    result: SuccessResponseBody<any>['result'];
    data?: SuccessResponseBody<any>['data'];
    error?: ErrorResponseBody<any>['error'];
  }>;
  error?: Error;
};
