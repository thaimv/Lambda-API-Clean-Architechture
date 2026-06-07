import 'reflect-metadata';
import { Container, injectable } from 'inversify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as moduleDecorator from '@/common/decorators/module.decorator'; // Import the module
import type { TNewable } from '@/common/types/app.type';
import { bootstrapApplication, getInstance } from '@/config/di/di.config';
import { GraphQLRouter } from '@/config/routes/graph-ql-router';

@injectable()
class TestProviderClass {}

@injectable()
class TestControllerA {}

@injectable()
class TestControllerB {}

vi.mock('@/config/routes/graph-ql-router', () => ({
  GraphQLRouter: vi.fn().mockImplementation(() => {
    return {
      registerController: vi.fn(),
    };
  }),
}));

describe('bootstrapApplication', () => {
  beforeEach(() => {});
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('should bind providers, controllers, imports to the container', () => {
    const entryModule = {} as TNewable<unknown>;
    const router = new GraphQLRouter();

    const containerBindSpy = vi.spyOn(Container.prototype as Container, 'bind');
    vi.spyOn(moduleDecorator, 'getModuleMetadata').mockReturnValue({
      imports: [],
      providers: [
        { provide: 'provider1', useValue: 'value1' },
        {
          provide: 'provider2',
          useClass: TestProviderClass,
        },
        { provide: 'provider3', useFactory: () => 'value3' },
      ],
      controllers: [TestControllerA, TestControllerB],
    });
    bootstrapApplication(entryModule, router);

    expect(containerBindSpy).toHaveBeenCalledTimes(5);
    expect(containerBindSpy).toHaveBeenCalledWith('provider1');
    expect(containerBindSpy).toHaveBeenCalledWith('provider2');
    expect(containerBindSpy).toHaveBeenCalledWith('provider3');

    expect(getInstance('provider1')).toBe('value1');
    expect(getInstance('provider2')).toBeInstanceOf(TestProviderClass);
    expect(getInstance('provider3')).toBe('value3');

    expect(router.registerController).toHaveBeenCalledTimes(2);
  });

  it('should skip providers already bound (shared imports)', () => {
    const entryModule = {} as TNewable<unknown>;
    const router = new GraphQLRouter();
    const sharedToken = Symbol.for('SharedProvider');

    vi.spyOn(moduleDecorator, 'getModuleMetadata').mockReturnValue({
      imports: [],
      providers: [
        { provide: sharedToken, useClass: TestProviderClass },
        { provide: sharedToken, useClass: TestProviderClass },
      ],
      controllers: [],
    });

    bootstrapApplication(entryModule, router);

    expect(getInstance(sharedToken)).toBeInstanceOf(TestProviderClass);
  });
});
