import 'reflect-metadata';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { DI } from '@/common/constants/di.const';
import { ExistedError } from '@/common/errors/existed-error';
import { NotFoundError } from '@/common/errors/notfound-error';
import type { IUserRepo as ICommonUserRepo } from '@/common/repos/user/user.repo';
import type { TAuthUser } from '@/common/types/app.type';
import { UserRepo } from '@/modules/user/repos/implements/user.repo.impl';
import { UserUseCase } from '@/modules/user/usecases/implement/user.uc.impl';
import { USER_DI_CONST } from '@/modules/user/user.const';
import { TestHelper } from '~/common/helpers/test.helper';
import {
  createUserInfoRequest,
  createUserInfoStub,
} from '~/unit-test/modules/user/stubs/user.stub';

describe('UserUseCase', () => {
  let userUseCase: UserUseCase;
  let userRepo: UserRepo;
  let commonUserRepo: ICommonUserRepo;

  const authUser: TAuthUser = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    username: 'username',
  };

  beforeAll(() => {
    const testModule = TestHelper.createTestingModule([
      {
        provide: DI.COMMON_USER_REPO,
        useValue: {
          getUserByNickname: vi.fn(),
          getUserByCognitoSub: vi.fn(),
        },
      },
      {
        provide: DI.DB_CLIENT_DATASOURCE,
        useValue: {
          getClient: vi.fn(),
        },
      },
      {
        provide: USER_DI_CONST.IUserRepo,
        useClass: UserRepo,
      },
      UserUseCase,
    ]);

    userUseCase = testModule.get(UserUseCase);
    userRepo = testModule.get(USER_DI_CONST.IUserRepo);
    commonUserRepo = testModule.get(DI.COMMON_USER_REPO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should create or update a user', async () => {
    const dbItem = createUserInfoStub();
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(commonUserRepo, 'getUserByNickname').mockResolvedValue(null);
    vi.spyOn(userRepo, 'saveUser').mockResolvedValue(dbItem);

    const result = await userUseCase.saveUser(userInfoDto, authUser);

    expect(commonUserRepo.getUserByNickname).toHaveBeenCalledWith(userInfoDto.input.userNickname);
    expect(userRepo.saveUser).toHaveBeenCalledWith(userInfoDto, authUser);
    expect(result).toEqual({
      cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
      userNickname: 'example_userNickname',
      cognitoId: 'cognito-id-123',
    });
  });

  test('should allow current user to keep their nickname', async () => {
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(commonUserRepo, 'getUserByNickname').mockResolvedValue(createUserInfoStub());
    vi.spyOn(userRepo, 'saveUser').mockResolvedValue(createUserInfoStub());

    await expect(userUseCase.saveUser(userInfoDto, authUser)).resolves.toEqual({
      cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
      userNickname: 'example_userNickname',
      cognitoId: 'cognito-id-123',
    });
  });

  test('should throw ExistedError when nickname belongs to another user', async () => {
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(commonUserRepo, 'getUserByNickname').mockResolvedValue({
      ...createUserInfoStub(),
      cognitoSub: 'another-user-id',
    });
    const saveUserSpy = vi.spyOn(userRepo, 'saveUser');

    await expect(userUseCase.saveUser(userInfoDto, authUser)).rejects.toThrow(ExistedError);
    expect(saveUserSpy).not.toHaveBeenCalled();
  });

  test('should throw when repository throws', async () => {
    const userInfoDto = createUserInfoRequest();
    vi.spyOn(commonUserRepo, 'getUserByNickname').mockResolvedValue(null);
    vi.spyOn(userRepo, 'saveUser').mockRejectedValue(new Error('Database error'));

    await expect(userUseCase.saveUser(userInfoDto, authUser)).rejects.toThrow('Database error');
  });

  test('should return current user from database', async () => {
    vi.spyOn(commonUserRepo, 'getUserByCognitoSub').mockResolvedValue(createUserInfoStub());

    await expect(userUseCase.getCurrentUser(authUser)).resolves.toEqual({
      cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
      userNickname: 'example_userNickname',
      cognitoId: 'cognito-id-123',
    });
    expect(commonUserRepo.getUserByCognitoSub).toHaveBeenCalledWith(authUser.userId);
  });

  test('should throw NotFoundError when current user does not exist', async () => {
    vi.spyOn(commonUserRepo, 'getUserByCognitoSub').mockResolvedValue(null);

    await expect(userUseCase.getCurrentUser(authUser)).rejects.toThrow(NotFoundError);
  });
});
