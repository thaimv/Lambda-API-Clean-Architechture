import 'reflect-metadata';
import { describe, it, expect } from 'vitest';

import { RouteName } from '@/common/constants/graphql-api.const';
import { Route, getRouteMetadata } from '@/common/decorators/route.decorator';

describe('Route Decorator', () => {
  it('should define route metadata for a method', () => {
    const mockRouteName: RouteName = RouteName.GET_HOME_NOTIFICATIONS;

    class TestController {
      @Route(mockRouteName)
      testMethod() {}
    }

    const metadata = getRouteMetadata(TestController.prototype, 'testMethod');
    expect(metadata).toBe(mockRouteName);
  });

  it('should return undefined if no route metadata is defined', () => {
    class TestController {
      noRouteMethod() {}
    }

    const metadata = getRouteMetadata(TestController.prototype, 'noRouteMethod');
    expect(metadata).toBeUndefined();
  });
});
