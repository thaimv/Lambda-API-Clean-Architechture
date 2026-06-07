import 'reflect-metadata';

import { HttpMethod } from '@/common/constants/rest-api.const';

export const routeMetadataKey = Symbol('route-rest-api');

export interface RestApiRouteMetadata {
  path: string;
  method: HttpMethod;
}

/**
 * Decorator to define a route for a controller method.
 */
const createRouteDecorator = (method: HttpMethod) => {
  return (path: string): MethodDecorator => {
    return (target, propertyKey) => {
      const metadata: RestApiRouteMetadata = {
        path,
        method,
      };
      Reflect.defineMetadata(routeMetadataKey, metadata, target, propertyKey);
    };
  };
};

/**
 * Decorator to define a GET route for a controller method.
 */
export const Get = createRouteDecorator(HttpMethod.GET);

/**
 * Decorator to define a POST route for a controller method.
 */
export const Post = createRouteDecorator(HttpMethod.POST);

/**
 * Decorator to define a PUT route for a controller method.
 */
export const Put = createRouteDecorator(HttpMethod.PUT);

/**
 * Decorator to define a PATCH route for a controller method.
 */
export const Patch = createRouteDecorator(HttpMethod.PATCH);

/**
 * Decorator to define a DELETE route for a controller method.
 */
export const Delete = createRouteDecorator(HttpMethod.DELETE);

/**
 * Get the route metadata for a controller method
 */
export const getRestApiRouteMetadata = (
  target: object,
  propertyKey: string | symbol,
): RestApiRouteMetadata => {
  return Reflect.getMetadata(routeMetadataKey, target, propertyKey);
};
