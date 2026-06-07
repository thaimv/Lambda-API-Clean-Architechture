/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import type { TAuthUser } from '@/common/types/app.type';
import type { TRequestEvent } from '@/common/types/event.type';
import { UserGraphController } from '@/modules/user/controllers/user.graph.controller';
import type { CreateUserInfoRequest } from '@/modules/user/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/user/dtos/responses/create-user-info.response.dto';
import { USER_DI_CONST } from '@/modules/user/user.const';
import { TestHelper } from '~/common/helpers/test.helper';

let userController: UserGraphController;
let mockUserUseCase: any;

beforeAll(() => {
  mockUserUseCase = {
    saveUser: vi.fn(),
  };

  const testModule = TestHelper.createTestingModule([
    {
      provide: USER_DI_CONST.IUserUseCase,
      useValue: mockUserUseCase,
    },
    UserGraphController,
  ]);

  userController = testModule.get(UserGraphController);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UserGraphController', () => {
  describe('create', () => {
    test('should call userUseCase.saveUser and return user info', async () => {
      const mockRequest: TRequestEvent<CreateUserInfoRequest> = {
        arguments: {
          input: {
            userNickname: 'TestUser',
          },
        },
      } as any;

      const mockAuthUser: TAuthUser = {
        userId: 'user-123',
        username: 'testUser',
      };

      const mockResponse: UserInfoResponse = {
        cognitoSub: 'new-user-id',
        userNickname: 'Test User',
        cognitoId: 'cognito-id-123',
      } as any;

      vi.spyOn(mockUserUseCase, 'saveUser').mockResolvedValue(mockResponse);

      const result = await userController.create(mockRequest, mockAuthUser);

      expect(mockUserUseCase.saveUser).toHaveBeenCalledWith(mockRequest.arguments, mockAuthUser);
      expect(result).toEqual(mockResponse);
    });

    test('should propagate error when userUseCase.saveUser throws', async () => {
      const mockRequest: TRequestEvent<CreateUserInfoRequest> = {
        arguments: {
          input: {
            userNickname: 'TestUser',
          },
        },
      } as any;

      const mockAuthUser: TAuthUser = {
        userId: 'user-123',
        username: 'testUser',
      };

      const expectedError = new Error('Save user failed');
      vi.spyOn(mockUserUseCase, 'saveUser').mockRejectedValue(expectedError);

      await expect(userController.create(mockRequest, mockAuthUser)).rejects.toThrow(
        'Save user failed',
      );
    });
  });
});
