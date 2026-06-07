import type { APIGatewayProxyHandler } from 'aws-lambda';
import 'reflect-metadata';
import 'source-map-support/register';

import { Lambda } from '@/common/lambda/lambda';
import { bootstrapApplication } from '@/config/di/di.config';
import { RestApiRouter } from '@/config/routes/rest-api-router';
import { AuthApiModule } from '@/modules/auth-api.module';

const router = new RestApiRouter(false);
bootstrapApplication(AuthApiModule, router);

/**
 * @function handler
 * @description AWS Lambda handler for auth-api Gateway (POST /auth/credential).
 */
export const handler: APIGatewayProxyHandler = new Lambda((event, _context) =>
  router.invoke(event),
).createHandler();
