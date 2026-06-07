// @ts-nocheck — template file; path aliases resolve correctly in generated output under tests/
import 'reflect-metadata';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import type { TApiGatewayCustomEvent } from '@/common/types/event.type';
import { <ControllerClass> } from '@/modules/<module>/controllers/<name>.rest.controller';
import { <MODULE>_DI_CONST } from '@/modules/<module>/<module>.const';
import { TestHelper } from '~/common/helpers/test.helper';

let controller: <ControllerClass>;
let mockUseCase: { <methodName>: ReturnType<typeof vi.fn> };

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
      const event = {
        headers: { cookie: 'project_access_token=test.token.here' },
        body: JSON.stringify({ fieldName: 'example_value' }),
        pathParameters: {},
        queryStringParameters: {},
      } as TApiGatewayCustomEvent<unknown>;
      const expected = { resultCode: 'SC-001' };
      vi.spyOn(mockUseCase, '<methodName>').mockResolvedValue(expected);

      // Act
      const result = await controller.<methodName>(event);

      // Assert
      expect(mockUseCase.<methodName>).toHaveBeenCalledWith(
        expect.objectContaining({ fieldName: 'example_value' }),
      );
      expect(result).toEqual(expected);
    });

    test('should propagate error when use case throws', async () => {
      // Arrange
      const event = {
        headers: { cookie: 'project_access_token=test.token.here' },
        body: JSON.stringify({ fieldName: 'example_value' }),
      } as TApiGatewayCustomEvent<unknown>;
      const error = new Error('use case error');
      vi.spyOn(mockUseCase, '<methodName>').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.<methodName>(event)).rejects.toThrow('use case error');
    });
  });
});
