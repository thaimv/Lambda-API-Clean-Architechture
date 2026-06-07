/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import type { TAuthUser } from '@/common/types/app.type';
import type { TRequestEvent } from '@/common/types/event.type';
import { UsersGraphController } from '@/modules/users/controllers/users.graph.controller';
import type { CreateUserInfoRequest } from '@/modules/users/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/users/dtos/responses/create-user-info.response.dto';
import { USERS_DI_CONST } from '@/modules/users/users.const';
import { TestHelper } from '~/common/helpers/test.helper';

let usersController: UsersGraphController;
let mockUsersUseCase: any;

beforeAll(() => {
  mockUsersUseCase = {
    saveUser: vi.fn(),
  };

  const testModule = TestHelper.createTestingModule([
    {
      provide: USERS_DI_CONST.IUsersUseCase,
      useValue: mockUsersUseCase,
    },
    UsersGraphController,
  ]);

  usersController = testModule.get(UsersGraphController);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UsersGraphController', () => {
  describe('create', () => {
    test('should call usersUseCase.saveUser and return user info', async () => {
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
        gigyaUuid: 'new-user-id',
        userNickname: 'Test User',
        cognitoId: 'cognito-id-123',
      } as any;

      vi.spyOn(mockUsersUseCase, 'saveUser').mockResolvedValue(mockResponse);

      const result = await usersController.create(mockRequest, mockAuthUser);

      expect(mockUsersUseCase.saveUser).toHaveBeenCalledWith(mockRequest.arguments, mockAuthUser);
      expect(result).toEqual(mockResponse);
    });

    test('should propagate error when usersUseCase.saveUser throws', async () => {
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
      vi.spyOn(mockUsersUseCase, 'saveUser').mockRejectedValue(expectedError);

      await expect(usersController.create(mockRequest, mockAuthUser)).rejects.toThrow(
        'Save user failed',
      );
    });
  });
});
