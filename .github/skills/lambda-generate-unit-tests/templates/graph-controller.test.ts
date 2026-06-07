// @ts-nocheck — template file; path aliases resolve correctly in generated output under tests/
import 'reflect-metadata';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import type { TAuthUser } from '@/common/types/app.type';
import type { TRequestEvent } from '@/common/types/event.type';
import { <ControllerClass> } from '@/modules/<module>/controllers/<name>.graph.controller';
import type { <RequestType> } from '@/modules/<module>/dtos/requests/<name>.request.dto';
import { <MODULE>_DI_CONST } from '@/modules/<module>/<module>.const';
import { TestHelper } from '~/common/helpers/test.helper';

let controller: <ControllerClass>;
let mockUseCase: { <methodName>: ReturnType<typeof vi.fn> };

const AUTH_USER: TAuthUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  username: 'test-user',
};

beforeAll(() => {
  mockUseCase = { <methodName>: vi.fn() };

  const testModule = TestHelper.createTestingModule([
    {
      provide: <MODULE>_DI_CONST.I<UseCaseInterface>,
      useValue: mockUseCase,
    },
    <ControllerClass>,
  ]);

  controller = testModule.get(<ControllerClass>);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<ControllerClass>', () => {
  describe('<methodName>', () => {
    test('should call use case with correct args and return result', async () => {
      // Arrange
      const request: TRequestEvent<<RequestType>> = {
        arguments: { input: { fieldName: 'example_value' } },
      } as any;
      const expected = { fieldOne: 'result' };
      vi.spyOn(mockUseCase, '<methodName>').mockResolvedValue(expected);

      // Act
      const result = await controller.<methodName>(request, AUTH_USER);

      // Assert
      expect(mockUseCase.<methodName>).toHaveBeenCalledWith(request.arguments, AUTH_USER);
      expect(result).toEqual(expected);
    });

    test('should propagate error when use case throws', async () => {
      // Arrange
      const request: TRequestEvent<<RequestType>> = {
        arguments: { input: { fieldName: 'example_value' } },
      } as any;
      const error = new Error('use case error');
      vi.spyOn(mockUseCase, '<methodName>').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.<methodName>(request, AUTH_USER)).rejects.toThrow('use case error');
    });
  });
});
