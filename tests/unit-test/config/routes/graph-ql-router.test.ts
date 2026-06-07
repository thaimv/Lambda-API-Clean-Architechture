import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RouteName } from '@/common/constants/graphql-api.const';
import { getRouteMetadata } from '@/common/decorators/route.decorator';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';
import type { TRequestEvent } from '@/common/types/event.type';
import { StringUtil } from '@/common/utils/string.util';
import { getInstance } from '@/config/di/di.config';
import { GraphQLRouter } from '@/config/routes/graph-ql-router';

// Giả lập các dependencies
vi.mock('@/config/di/di.config', () => ({
  getInstance: vi.fn(),
}));

vi.mock('@/common/decorators/route.decorator', () => ({
  getRouteMetadata: vi.fn(),
}));

vi.mock('@/common/utils/string.util', () => ({
  StringUtil: {
    getGigyaUuidFromCognitoAuthProvider: vi.fn(),
    getUsernameFromIdentityUsername: vi.fn(),
  },
}));

describe('Router', () => {
  let router: GraphQLRouter;

  beforeEach(() => {
    router = new GraphQLRouter();
    vi.clearAllMocks();
  });

  describe('registerController', () => {
    it('should register routes based on controller metadata', () => {
      const mockController = class {
        exampleMethod() {}
      };

      const mockRouteName: RouteName = RouteName.CREATE_USER_INFO;

      // Giả lập kết quả của getRouteMetadata và getInstance
      const mockControllerInstance = new mockController();
      vi.mocked(getInstance).mockReturnValue(mockControllerInstance);
      vi.mocked(getRouteMetadata).mockImplementation((_target, propertyKey) => {
        return propertyKey === 'exampleMethod' ? mockRouteName : undefined;
      });

      router.registerController(mockController);

      expect(router['routesMap'].has(mockRouteName)).toBe(true);
    });
  });

  describe('invoke', () => {
    it('should invoke the correct controller method for a registered route', async () => {
      const mockEvent = {
        field: RouteName.CREATE_USER_INFO,
        identity: {
          cognitoIdentityAuthProvider: 'cognito-idp.example.com/userpool/example|mock-gigya-uuid',
          username: 'XXXXXXXXBRNUVQG6PYU5:CognitoIdentityCredentials',
        },
        body: { test: 'data' },
      } as unknown as TRequestEvent<unknown>;

      const mockControllerMethod = vi.fn();
      router['routesMap'].set(RouteName.CREATE_USER_INFO, mockControllerMethod);

      vi.mocked(StringUtil.getGigyaUuidFromCognitoAuthProvider).mockReturnValue('mock-gigya-uuid');
      vi.mocked(StringUtil.getUsernameFromIdentityUsername).mockReturnValue('XXXXXXXXBRNUVQG6PYU5');

      await router.invoke(mockEvent);

      expect(mockControllerMethod).toHaveBeenCalledWith(mockEvent, {
        userId: 'mock-gigya-uuid',
        username: 'XXXXXXXXBRNUVQG6PYU5',
      });
    });

    it('should throw UnauthorizedError if gigyaUuid is missing', async () => {
      const mockEvent = {
        field: RouteName.CREATE_USER_INFO,
        identity: {
          cognitoIdentityAuthProvider: '',
          username: 'XXXXXXXXBRNUVQG6PYU5:CognitoIdentityCredentials',
        },
        body: { test: 'data' },
      } as unknown as TRequestEvent<unknown>;

      const mockControllerMethod = vi.fn();
      router['routesMap'].set(RouteName.CREATE_USER_INFO, mockControllerMethod);

      vi.mocked(StringUtil.getGigyaUuidFromCognitoAuthProvider).mockReturnValue('');
      vi.mocked(StringUtil.getUsernameFromIdentityUsername).mockReturnValue('XXXXXXXXBRNUVQG6PYU5');

      await expect(router.invoke(mockEvent)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw an error if route is not found', async () => {
      const mockEvent = {
        field: 'NonExistentRoute',
        identity: {
          cognitoIdentityAuthProvider: 'cognito-idp.example.com/userpool/example|mock-gigya-uuid',
          username: 'XXXXXXXXBRNUVQG6PYU5:CognitoIdentityCredentials',
        },
        body: {},
      } as unknown as TRequestEvent<unknown>;

      vi.mocked(StringUtil.getGigyaUuidFromCognitoAuthProvider).mockReturnValue('mock-gigya-uuid');
      vi.mocked(StringUtil.getUsernameFromIdentityUsername).mockReturnValue('XXXXXXXXBRNUVQG6PYU5');

      await expect(router.invoke(mockEvent)).rejects.toThrowError(
        'Route NonExistentRoute not found',
      );
    });
  });
});
