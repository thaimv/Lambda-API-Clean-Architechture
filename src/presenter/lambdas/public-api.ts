import type { APIGatewayProxyHandler } from 'aws-lambda';
import 'reflect-metadata';
import 'source-map-support/register';

import { Lambda } from '@/common/lambda/lambda';
import { bootstrapApplication } from '@/config/di/di.config';
import { RestApiRouter } from '@/config/routes/rest-api-router';
import { PublicApiModule } from '@/modules/public-api.module';

const router = new RestApiRouter(true);
bootstrapApplication(PublicApiModule, router);

/**
 * @function handler
 * @description AWS Lambda handler function for processing public API Gateway events.
 */
export const handler: APIGatewayProxyHandler = new Lambda((event, _context) =>
  router.invoke(event),
).createHandler();
