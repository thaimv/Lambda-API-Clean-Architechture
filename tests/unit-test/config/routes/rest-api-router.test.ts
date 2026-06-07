import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HttpMethod } from '@/common/constants/rest-api.const';
import { BadRequestError } from '@/common/errors/bad-request-error';
import { NotFoundError } from '@/common/errors/notfound-error';
import { UnauthorizedError } from '@/common/errors/unauthorized-error';
import { getInstance } from '@/config/di/di.config';
import { RestApiRouter } from '@/config/routes/rest-api-router';

vi.mock('@/config/di/di.config', () => ({
  getInstance: vi.fn(),
}));

const authenticatedIdentity = {
  cognitoAuthenticationProvider:
    'cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:550e8400-e29b-41d4-a716-446655440000',
  cognitoIdentityId: 'us-east-1:0287e4c8-0ef4-4108-82f0-3171b6410fbd',
  user: 'XROA4XXXXXXYU3:CognitoIdentityCredentials',
};

describe('RestApiRouter', () => {
  let router: RestApiRouter;

  beforeEach(() => {
    router = new RestApiRouter(true);
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

      vi.spyOn(Reflect, 'getMetadata').mockImplementation(
        (key: any, target: any, propertyKey?: string | symbol) => {
          if (propertyKey === 'exampleMethod') {
            return mockRouteMetadata;
          }
          return undefined;
        },
      );

      router.registerController(mockController);

      expect(router['routes']).toHaveLength(1);
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
          identity: authenticatedIdentity,
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

      const result = await router.invoke(mockEvent);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { key: 'value' },
          authUser: {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            username: 'XROA4XXXXXXYU3',
            cognitoAuthenticationProvider: authenticatedIdentity.cognitoAuthenticationProvider,
          },
        }),
        expect.objectContaining({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          username: 'XROA4XXXXXXYU3',
        }),
      );
      expect(result.statusCode).toBe(200);
    });

    it('should resolve path and method from HTTP API v2 event format', async () => {
      const mockEvent = {
        version: '2.0',
        rawPath: '/example',
        requestContext: {
          http: { method: 'GET', path: '/example' },
          identity: authenticatedIdentity,
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

    it('should throw BadRequestError when event is missing path and method', async () => {
      const mockEvent = {
        requestContext: { identity: {} },
      } as unknown as APIGatewayProxyEvent;

      await expect(router.invoke(mockEvent)).rejects.toThrow(BadRequestError);
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

    it('should throw UnauthorizedError when auth is incomplete', async () => {
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

      router['routes'].push({
        method: HttpMethod.GET,
        path: '/example',
        matcher: () => ({ path: '/example', params: {} }),
        handler: vi.fn(),
      });

      await expect(router.invoke(mockEvent)).rejects.toThrow(UnauthorizedError);
    });

    it('should skip authentication if enableAuthen is false', async () => {
      router = new RestApiRouter(false);

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
