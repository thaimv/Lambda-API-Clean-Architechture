import { describe, expect, test } from 'vitest';

import { getModuleMetadata, Module } from '@/common/decorators/module.decorator';

describe('Module Decorator', () => {
  class ModuleA {}
  class ControllerA {}
  test('should define module metadata correctly', () => {
    @Module({
      imports: [ModuleA],
      providers: [{ provide: 'ServiceA', useValue: {} }],
      controllers: [ControllerA],
    })
    class AppModule {}

    const metadata = getModuleMetadata(AppModule);

    expect(metadata.imports).toEqual([ModuleA]);
    expect(metadata.providers).toEqual([{ provide: 'ServiceA', useValue: {} }]);
    expect(metadata.controllers).toEqual([ControllerA]);
  });

  test('missing metadata properties', () => {
    @Module({})
    class AppModule {}

    const metadata = getModuleMetadata(AppModule.prototype);

    expect(metadata.imports).toEqual([]);
    expect(metadata.providers).toEqual([]);
    expect(metadata.controllers).toEqual([]);
  });
});
