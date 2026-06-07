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

export type GraphQLExecutionInput = {
  input: TRequestEvent<unknown>;
  context?: Context;
};

export type GraphQLExecutionOutput = {
  output: any;
  error?: Error;
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
