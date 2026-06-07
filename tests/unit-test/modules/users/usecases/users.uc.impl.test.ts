import 'reflect-metadata';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { DI } from '@/common/constants/di.const';
import { ExistedError } from '@/common/errors/existed-error';
import type { IUserRepo } from '@/common/repos/user/user.repo';
import type { TAuthUser } from '@/common/types/app.type';
import { UsersRepo } from '@/modules/users/repos/implements/users.repo.impl';
import { UsersUseCase } from '@/modules/users/usecases/implement/users.uc.impl';
import { USERS_DI_CONST } from '@/modules/users/users.const';
import { TestHelper } from '~/common/helpers/test.helper';
import {
  createUserInfoRequest,
  createUserInfoStub,
} from '~/unit-test/modules/users/stubs/user.stub';

describe('Users UseCase', () => {
  let usersUseCase: UsersUseCase;
  let usersRepo: UsersRepo;
  let userRepo: IUserRepo;

  const authUser: TAuthUser = {
    userId: '022fca7aee5d439b9b92870b087f2825',
    username: 'username',
  };

  beforeAll(() => {
    const testModule = TestHelper.createTestingModule([
      {
        provide: DI.COMMON_USER_REPO,
        useValue: {
          getUserByNickname: vi.fn(),
        },
      },
      {
        provide: DI.DB_CLIENT_DATASOURCE,
        useValue: {
          getClient: vi.fn(),
        },
      },
      {
        provide: USERS_DI_CONST.IUsersRepo,
        useClass: UsersRepo,
      },
      UsersUseCase,
    ]);

    usersUseCase = testModule.get(UsersUseCase);
    usersRepo = testModule.get(USERS_DI_CONST.IUsersRepo);
    userRepo = testModule.get(DI.COMMON_USER_REPO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should create or update a user', async () => {
    const dbItem = createUserInfoStub();
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(userRepo, 'getUserByNickname').mockResolvedValue(null);
    vi.spyOn(usersRepo, 'saveUser').mockResolvedValue(dbItem);

    const result = await usersUseCase.saveUser(userInfoDto, authUser);

    expect(userRepo.getUserByNickname).toHaveBeenCalledWith(userInfoDto.input.userNickname);
    expect(usersRepo.saveUser).toHaveBeenCalledWith(userInfoDto, authUser);
    expect(result).toEqual({
      gigyaUuid: '022fca7aee5d439b9b92870b087f2825',
      userNickname: 'example_userNickname',
      cognitoId: 'cognito-id-123',
    });
  });

  test('should allow current user to keep their nickname', async () => {
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(userRepo, 'getUserByNickname').mockResolvedValue(createUserInfoStub());
    vi.spyOn(usersRepo, 'saveUser').mockResolvedValue(createUserInfoStub());

    await expect(usersUseCase.saveUser(userInfoDto, authUser)).resolves.toEqual({
      gigyaUuid: '022fca7aee5d439b9b92870b087f2825',
      userNickname: 'example_userNickname',
      cognitoId: 'cognito-id-123',
    });
  });

  test('should throw ExistedError when nickname belongs to another user', async () => {
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(userRepo, 'getUserByNickname').mockResolvedValue({
      ...createUserInfoStub(),
      gigyaUuid: 'another-user-id',
    });
    const saveUserSpy = vi.spyOn(usersRepo, 'saveUser');

    await expect(usersUseCase.saveUser(userInfoDto, authUser)).rejects.toThrow(ExistedError);
    expect(saveUserSpy).not.toHaveBeenCalled();
  });

  test('should throw when repository throws', async () => {
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(userRepo, 'getUserByNickname').mockResolvedValue(null);
    vi.spyOn(usersRepo, 'saveUser').mockRejectedValue(new Error('Database error'));

    await expect(usersUseCase.saveUser(userInfoDto, authUser)).rejects.toThrow('Database error');
  });
});
