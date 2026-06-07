import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { match, type MatchFunction } from 'path-to-regexp';

import { ERROR_MESSAGE } from '@/common/constants/response.const';
import type { HttpMethod } from '@/common/constants/rest-api.const';
import {
  routeMetadataKey,
  type RestApiRouteMetadata,
} from '@/common/decorators/rest-api-route.decorator';
import { NotFoundError } from '@/common/errors/notfound-error';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';
import type { TAuthUser, TNewable } from '@/common/types/app.type';
import type { TApiGatewayCustomEvent } from '@/common/types/event.type';
import { StringUtil } from '@/common/utils/string.util';
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
    const incomingMethod = event.httpMethod as HttpMethod;
    const incomingPath = event.path.replace(/\/+$/, ''); // remove trailing slash

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

    // Extract gigyaUUid as userId from event if available
    const gigyaUuid = StringUtil.getGigyaUuidFromCognitoAuthProvider(
      event.requestContext.identity.cognitoAuthenticationProvider ?? '',
    );

    // Extract username as username from event if available
    const username = StringUtil.getUsernameFromIdentityUsername(
      event.requestContext.identity.user ?? '',
    );

    if (this.enableAuthen) {
      if (!gigyaUuid || !username || !event.requestContext.identity.cognitoIdentityId) {
        throw new UnauthorizedError(ERROR_MESSAGE.UNAUTHORIZED);
      }
    }

    const bodyObject = JSON.parse(event.body ?? '{}');

    return await matchedRoute.handler(
      {
        body: bodyObject,
        queryStringParameters: event.queryStringParameters,
        pathParameters: pathParams,
        resource: event.resource,
        path: event.path,
        authUser: {
          cognitoAuthenticationProvider:
            event.requestContext.identity.cognitoAuthenticationProvider ?? '',
          userId: gigyaUuid,
          username: username,
        },
        headers: event.headers,
        httpMethod: event.httpMethod,
        isBase64Encoded: event.isBase64Encoded,
        identity: event.requestContext.identity,
      },
      {
        cognitoAuthenticationProvider:
          event.requestContext.identity.cognitoAuthenticationProvider ?? '',
        userId: gigyaUuid,
        username: username,
      },
    );
  }

  private genRouteKey(metadata: RestApiRouteMetadata) {
    return `/${metadata.method} ${metadata.path}`;
  }
}
