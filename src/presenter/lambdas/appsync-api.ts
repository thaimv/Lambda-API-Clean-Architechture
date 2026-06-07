import 'reflect-metadata';
import 'source-map-support/register';

import type { Context } from 'aws-lambda';

import { Pipeline } from '@/common/lambda/pipeline';
import { ErrorHandlingPipe } from '@/common/lambda/pipes/error-handling.pipe';
import { createGraphQLLoggingPipe } from '@/common/lambda/pipes/logging.pipe';
import type { TRequestEvent } from '@/common/types/event.type';
import type {
  GraphQLExecutionInput,
  GraphQLExecutionOutput,
  GraphQLHandlerResult,
} from '@/common/types/lambda.type';
import { bootstrapApplication } from '@/config/di/di.config';
import { GraphQLRouter } from '@/config/routes/graph-ql-router';
import { AppsyncApiModule } from '@/modules/appsync-api.module';

const router = new GraphQLRouter();
bootstrapApplication(AppsyncApiModule, router);

export const handler = async (
  input: TRequestEvent<unknown>,
  context?: Context,
): Promise<GraphQLHandlerResult> => {
  const res = await new Pipeline<GraphQLExecutionInput, GraphQLExecutionOutput>()
    .send({ input, context })
    .through([
      createGraphQLLoggingPipe(),
      new ErrorHandlingPipe<GraphQLExecutionInput, GraphQLExecutionOutput>(),
    ])
    .then(async (passable) => {
      const output = await router.invoke(passable.input);
      return { output };
    });

  return res.output;
};
