import 'reflect-metadata';
import 'source-map-support/register';

import type { Context } from 'aws-lambda';

import { Pipeline } from '@/common/lambda/pipeline';
import { GraphQLErrorHandlingPipe } from '@/common/lambda/pipes/graphql-error-handling.pipe';
import { GraphQLLoggingPipe } from '@/common/lambda/pipes/graphql-logging.pipe';
import type { TRequestEvent } from '@/common/types/event.type';
import type { GraphQLExecutionInput, GraphQLExecutionOutput } from '@/common/types/lambda.type';
import { bootstrapApplication } from '@/config/di/di.config';
import { GraphQLRouter } from '@/config/routes/graph-ql-router';
import { AppsyncApiModule } from '@/modules/appsync-api.module';

const router = new GraphQLRouter();
bootstrapApplication(AppsyncApiModule, router);

export const handler = async (input: TRequestEvent<unknown>, context?: Context) => {
  const res = await new Pipeline<GraphQLExecutionInput, GraphQLExecutionOutput>()
    .send({ input, context })
    .through([new GraphQLLoggingPipe(), new GraphQLErrorHandlingPipe()])
    .then(async (passable) => {
      const output = await router.invoke(passable.input);
      return { output };
    });

  return res.output;
};
