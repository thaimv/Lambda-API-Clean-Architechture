import 'reflect-metadata';
import { describe, it, expect } from 'vitest';

import { HttpMethod } from '@/common/constants/rest-api.const';
import {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  getRestApiRouteMetadata,
} from '@/common/decorators/rest-api-route.decorator';

describe('Route Decorators', () => {
  it('should define GET route metadata', () => {
    class TestController {
      @Get('/test-get')
      getMethod() {}
    }

    const metadata = getRestApiRouteMetadata(TestController.prototype, 'getMethod');
    expect(metadata).toEqual({ path: '/test-get', method: HttpMethod.GET });
  });

  it('should define POST route metadata', () => {
    class TestController {
      @Post('/test-post')
      postMethod() {}
    }

    const metadata = getRestApiRouteMetadata(TestController.prototype, 'postMethod');
    expect(metadata).toEqual({ path: '/test-post', method: HttpMethod.POST });
  });

  it('should define PUT route metadata', () => {
    class TestController {
      @Put('/test-put')
      putMethod() {}
    }

    const metadata = getRestApiRouteMetadata(TestController.prototype, 'putMethod');
    expect(metadata).toEqual({ path: '/test-put', method: HttpMethod.PUT });
  });

  it('should define PATCH route metadata', () => {
    class TestController {
      @Patch('/test-patch')
      patchMethod() {}
    }

    const metadata = getRestApiRouteMetadata(TestController.prototype, 'patchMethod');
    expect(metadata).toEqual({ path: '/test-patch', method: HttpMethod.PATCH });
  });

  it('should define DELETE route metadata', () => {
    class TestController {
      @Delete('/test-delete')
      deleteMethod() {}
    }

    const metadata = getRestApiRouteMetadata(TestController.prototype, 'deleteMethod');
    expect(metadata).toEqual({ path: '/test-delete', method: HttpMethod.DELETE });
  });

  it('should return undefined if no route metadata is defined', () => {
    class TestController {
      noRouteMethod() {}
    }

    const metadata = getRestApiRouteMetadata(TestController.prototype, 'noRouteMethod');
    expect(metadata).toBeUndefined();
  });
});
