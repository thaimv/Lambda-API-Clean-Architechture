import type { RouteName } from '@/common/constants/graphql-api.const';
import { getRouteMetadata } from '@/common/decorators/route.decorator';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';
import type { TAuthUser, TNewable } from '@/common/types/app.type';
import type { TRequestEvent } from '@/common/types/event.type';
import { StringUtil } from '@/common/utils/string.util';
import { getInstance } from '@/config/di/di.config';
import type { IRouter } from '@/config/routes/router.interface';

/**
 * @description Router class to register controllers and route event to appropriate controller method based on the event field.
 * GraphQL Router
 */
export class GraphQLRouter implements IRouter<TRequestEvent<unknown>> {
  private routesMap = new Map<
    RouteName,
    (event: TRequestEvent<unknown>, authUser: TAuthUser) => unknown
  >();

  registerController<T>(controllerClass: TNewable<T>) {
    const controllerInstance = getInstance(controllerClass) as object;
    Object.getOwnPropertyNames(Object.getPrototypeOf(controllerInstance)).forEach((method) => {
      const route = getRouteMetadata(controllerInstance, method);
      if (route) {
        this.routesMap.set(route, controllerInstance[method].bind(controllerInstance));
      }
    });
  }

  async invoke(event: TRequestEvent<unknown>) {
    const route = event.field;

    const controllerMethod = this.routesMap.get(route);
    if (!controllerMethod) {
      throw new Error(`Route ${route} not found`);
    }

    // Extract gigyaUUid as userId from event if available
    const gigyaUuid = StringUtil.getGigyaUuidFromCognitoAuthProvider(
      event.identity.cognitoIdentityAuthProvider,
    );

    // Extract username as username from event if available
    const username = StringUtil.getUsernameFromIdentityUsername(event.identity.username);

    if (!gigyaUuid || !username) {
      throw new UnauthorizedError();
    }

    const cognitoIdentityId = event.identity.cognitoIdentityId;

    return await controllerMethod(event, {
      userId: gigyaUuid,
      username: username,
      cognitoIdentityId: cognitoIdentityId,
    });
  }
}
