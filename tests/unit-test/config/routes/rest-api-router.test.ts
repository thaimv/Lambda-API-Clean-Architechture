import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HttpMethod } from '@/common/constants/rest-api.const';
import { NotFoundError } from '@/common/errors/notfound-error';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';
import { StringUtil } from '@/common/utils/string.util';
import { getInstance } from '@/config/di/di.config';
import { RestApiRouter } from '@/config/routes/rest-api-router';
// Mock dependencies
vi.mock('@/config/di/di.config', () => ({
  getInstance: vi.fn(),
}));

vi.mock('@/common/utils/string.util', () => ({
  StringUtil: {
    getGigyaUuidFromCognitoAuthProvider: vi.fn(),
    getUsernameFromIdentityUsername: vi.fn(),
  },
}));

describe('RestApiRouter', () => {
  let router: RestApiRouter;

  beforeEach(() => {
    router = new RestApiRouter(true); // Enable authentication by default
    vi.clearAllMocks();
  });

  describe('registerController', () => {
    it('should register routes based on controller metadata', () => {
      const mockController = class {
        exampleMethod() {}
      };

      const mockRouteMetadata = {
        method: 'GET',
        path: '/example',
      };

      const mockControllerInstance = new mockController();
      vi.mocked(getInstance).mockReturnValue(mockControllerInstance);

      // Mock Reflect.getMetadata to return metadata only for the specific method
      vi.spyOn(Reflect, 'getMetadata').mockImplementation(
        (key: any, target: any, propertyKey?: string | symbol) => {
          if (propertyKey === 'exampleMethod') {
            return mockRouteMetadata;
          }
          return undefined;
        },
      );

      router.registerController(mockController);

      expect(router['routes']).toHaveLength(1); // Ensure only one route is registered
      expect(router['routes'][0].method).toBe('GET');
      expect(router['routes'][0].path).toBe('/example');
    });
  });

  describe('invoke', () => {
    it('should invoke the correct route handler with valid event', async () => {
      const mockEvent = {
        httpMethod: 'GET',
        path: '/example',
        requestContext: {
          identity: {
            cognitoAuthenticationProvider: 'mock-auth-provider',
            cognitoIdentityId: 'mock-identity-id',
            user: 'mock-user',
          },
        },
        body: JSON.stringify({ key: 'value' }),
      } as unknown as APIGatewayProxyEvent;

      const mockHandler = vi.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      router['routes'].push({
        method: HttpMethod.GET,
        path: '/example',
        matcher: () => ({ path: '/example', params: {} }),
        handler: mockHandler,
      });

      vi.mocked(StringUtil.getGigyaUuidFromCognitoAuthProvider).mockReturnValue('mock-user-id');
      vi.mocked(StringUtil.getUsernameFromIdentityUsername).mockReturnValue('mock-username');

      const result = await router.invoke(mockEvent);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { key: 'value' },
          authUser: {
            userId: 'mock-user-id',
            username: 'mock-username',
            cognitoAuthenticationProvider: 'mock-auth-provider',
          },
        }),
        expect.objectContaining({
          userId: 'mock-user-id',
          username: 'mock-username',
        }),
      );
      expect(result.statusCode).toBe(200);
    });

    it('should throw NotFoundError if no matching route is found', async () => {
      const mockEvent = {
        httpMethod: 'POST',
        path: '/non-existent',
        requestContext: {
          identity: {},
        },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      await expect(router.invoke(mockEvent)).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError if authentication is enabled and user is not authenticated', async () => {
      const mockEvent = {
        httpMethod: 'GET',
        path: '/example',
        requestContext: {
          identity: {
            cognitoAuthenticationProvider: '',
            cognitoIdentityId: null,
            user: '',
          },
        },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      // Đăng ký route trước khi gọi invoke
      router['routes'].push({
        method: HttpMethod.GET,
        path: '/example',
        matcher: () => ({ path: '/example', params: {} }),
        handler: vi.fn(), // Mock handler
      });

      await expect(router.invoke(mockEvent)).rejects.toThrow(UnauthorizedError);
    });

    it('should skip authentication if enableAuthen is false', async () => {
      router = new RestApiRouter(false); // Disable authentication

      const mockEvent = {
        httpMethod: 'GET',
        path: '/example',
        requestContext: {
          identity: {
            cognitoAuthenticationProvider: '',
            cognitoIdentityId: null,
            user: '',
          },
        },
        body: null,
      } as unknown as APIGatewayProxyEvent;

      const mockHandler = vi.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      router['routes'].push({
        method: HttpMethod.GET,
        path: '/example',
        matcher: () => ({ path: '/example', params: {} }),
        handler: mockHandler,
      });

      const result = await router.invoke(mockEvent);

      expect(mockHandler).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
    });
  });

  describe('genRouteKey', () => {
    it('should generate a route key based on metadata', () => {
      const metadata = { method: HttpMethod.GET, path: '/test-path' };
      const routeKey = router['genRouteKey'](metadata);
      expect(routeKey).toBe('/GET /test-path');
    });
  });
});
