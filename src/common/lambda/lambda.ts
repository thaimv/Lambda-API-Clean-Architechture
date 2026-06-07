import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';

import type { Pipe } from '@/common/lambda/pipeline';
import { Pipeline } from '@/common/lambda/pipeline';
import { ErrorHandlingPipe } from '@/common/lambda/pipes/error-handling.pipe';
import { createApiLoggingPipe } from '@/common/lambda/pipes/logging.pipe';
import { ApiGWResponse } from '@/common/responses/api-response';
import { SuccessResponse } from '@/common/responses/api-success-response';
import type {
  ApiExecutionInput,
  ApiExecutionOutput,
  LambdaHandler,
} from '@/common/types/lambda.type';

/**
 * Generic Lambda wrapper class to standardize AWS Lambda handlers.
 */
export class Lambda<TInput extends APIGatewayProxyEvent = APIGatewayProxyEvent, TOutput = unknown> {
  constructor(
    protected readonly handler: LambdaHandler<TInput, TOutput>,
    protected readonly pipes: Pipe<ApiExecutionInput, ApiExecutionOutput>[] = [
      createApiLoggingPipe(),
      new ErrorHandlingPipe<ApiExecutionInput, ApiExecutionOutput>(),
    ],
  ) {}

  createHandler(): APIGatewayProxyHandler {
    return async (event, context) => {
      const res = await new Pipeline<ApiExecutionInput, ApiExecutionOutput>()
        .send({ input: event, context })
        .through(this.pipes)
        .then(async (passable) => {
          const data = await this.handler(passable.input as TInput, passable.context);
          const output =
            data instanceof ApiGWResponse ? data : new SuccessResponse({ data: data as TOutput });

          return { output };
        });

      const { json: _json, ...output } = res.output;
      return output;
    };
  }
}
