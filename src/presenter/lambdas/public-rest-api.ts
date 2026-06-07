import type { APIGatewayProxyHandler } from 'aws-lambda';
import 'reflect-metadata';
import 'source-map-support/register';

import { Lambda } from '@/common/lambda/lambda';
import { bootstrapApplication } from '@/config/di/di.config';
import { RestApiRouter } from '@/config/routes/rest-api-router';
import { PublicRestApiModule } from '@/modules/public-rest-api.module';

const router = new RestApiRouter(true);
bootstrapApplication(PublicRestApiModule, router);

/**
 * @function handler
 * @description AWS Lambda handler function for processing public rest API Gateway events.
 */
export const handler: APIGatewayProxyHandler = new Lambda((event, _context) =>
  router.invoke(event),
).createHandler();
