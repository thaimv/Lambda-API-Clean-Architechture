import 'reflect-metadata';
import type { RouteName } from '@/common/constants/graphql-api.const';

const metadataKey = Symbol('route');

/**
 * Decorator to define a route for a controller method.
 * @param route name of the route
 *
 */
export const Route = (route: RouteName): MethodDecorator => {
  return (target, propertyKey) => {
    Reflect.defineMetadata(metadataKey, route, target, propertyKey);
  };
};

/**
 * Get the route metadata for a controller method
 * @param target The target object
 * @param propertyKey The method name
 * @returns The route metadata
 */
export const getRouteMetadata = (target: object, propertyKey: string | symbol): RouteName => {
  return Reflect.getMetadata(metadataKey, target, propertyKey);
};
