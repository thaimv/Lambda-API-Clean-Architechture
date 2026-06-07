import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { match, type MatchFunction } from 'path-to-regexp';

import { ERROR_MESSAGE } from '@/common/constants/response.const';
import type { HttpMethod } from '@/common/constants/rest-api.const';
import {
  routeMetadataKey,
  type RestApiRouteMetadata,
} from '@/common/decorators/rest-api-route.decorator';
import { BadRequestError } from '@/common/errors/bad-request-error';
import { NotFoundError } from '@/common/errors/notfound-error';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';
import type { TAuthUser, TNewable } from '@/common/types/app.type';
import type { TApiGatewayCustomEvent } from '@/common/types/event.type';
import { extractRestApiAuthContext } from '@/common/utils/api-gateway-identity.util';
import { getInstance } from '@/config/di/di.config';
import type { IRouter } from '@/config/routes/router.interface';

interface ApiRouteMetadata {
  path: string;
  method: HttpMethod;
}

// Using for REST API route metadata extraction
const restApiRouteMetadata = (target: object, propertyKey: string | symbol): ApiRouteMetadata => {
  return Reflect.getMetadata(routeMetadataKey, target, propertyKey);
};

type ApiGatewayLikeEvent = APIGatewayProxyEvent & {
  rawPath?: string;
  requestContext: APIGatewayProxyEvent['requestContext'] & {
    http?: { method?: string; path?: string };
  };
};

const resolveIncomingRequest = (event: ApiGatewayLikeEvent): { method: string; path: string } => {
  const method = event.httpMethod ?? event.requestContext?.http?.method;
  const path = event.path ?? event.rawPath ?? event.requestContext?.http?.path;

  if (!method || !path) {
    throw new BadRequestError(
      'Invalid API Gateway event: missing httpMethod/path. Use REST API with Lambda proxy integration.',
    );
  }

  return { method, path };
};

type RouteEntry = {
  method: HttpMethod;
  path: string;
  matcher: MatchFunction<Record<string, string>>;
  handler: (
    event: TApiGatewayCustomEvent<unknown>,
    authUser: TAuthUser,
  ) => Promise<APIGatewayProxyResult>;
};

/**
 * @description Router class to register controllers and route event to appropriate controller method based on the event field.
 * @class ApiRouter
 * @implements {IRouter<APIGatewayProxyEvent>}
 * @param {boolean} enableAuthen - Flag to enable or disable authentication check (default: true)
 */
export class RestApiRouter implements IRouter<APIGatewayProxyEvent> {
  private routes: RouteEntry[] = [];

  constructor(readonly enableAuthen: boolean) {}

  registerController<T>(controllerClass: TNewable<T>) {
    const controllerInstance = getInstance(controllerClass) as object;

    Object.getOwnPropertyNames(Object.getPrototypeOf(controllerInstance)).forEach((method) => {
      const route = restApiRouteMetadata(controllerInstance, method);
      if (!route) return;

      const matcher = match<Record<string, string>>(route.path, {
        decode: decodeURIComponent,
      });

      this.routes.push({
        method: route.method,
        path: route.path,
        matcher,
        handler: controllerInstance[method].bind(controllerInstance),
      });
    });
  }

  async invoke(event: APIGatewayProxyEvent) {
    const gatewayEvent = event as ApiGatewayLikeEvent;
    const { method, path } = resolveIncomingRequest(gatewayEvent);
    const incomingMethod = method as HttpMethod;
    const incomingPath = path.replace(/\/+$/, ''); // remove trailing slash

    let matchedRoute: RouteEntry | undefined;
    let pathParams: Record<string, string> = {};

    for (const route of this.routes) {
      if (route.method !== incomingMethod) continue;
      const result = route.matcher(incomingPath);
      if (result) {
        matchedRoute = route;
        pathParams = result.params;
        break;
      }
    }

    if (!matchedRoute) {
      throw new NotFoundError(`Route ${incomingMethod} ${incomingPath} not found`);
    }

    const authContext = extractRestApiAuthContext(event);

    if (
      this.enableAuthen &&
      (!authContext.userId || !authContext.username || !authContext.cognitoIdentityId)
    ) {
      throw new UnauthorizedError(ERROR_MESSAGE.UNAUTHORIZED);
    }

    const bodyObject = JSON.parse(event.body ?? '{}');

    return await matchedRoute.handler(
      {
        body: bodyObject,
        queryStringParameters: event.queryStringParameters,
        pathParameters: pathParams,
        resource: event.resource,
        path,
        authUser: {
          cognitoAuthenticationProvider: authContext.cognitoAuthenticationProvider,
          userId: authContext.userId,
          username: authContext.username,
        },
        headers: event.headers,
        httpMethod: event.httpMethod,
        isBase64Encoded: event.isBase64Encoded,
        identity: event.requestContext.identity,
      },
      {
        cognitoAuthenticationProvider: authContext.cognitoAuthenticationProvider,
        userId: authContext.userId,
        username: authContext.username,
      },
    );
  }

  private genRouteKey(metadata: RestApiRouteMetadata) {
    return `/${metadata.method} ${metadata.path}`;
  }
}
