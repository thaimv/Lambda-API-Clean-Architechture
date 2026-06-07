/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { beforeAll, beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

import { DI } from '@/common/constants/di.const';
import type { IDBClient } from '@/common/datasources/database/db-client.datasource';
import type { TAuthUser } from '@/common/types/app.type';
import { UsersRepo } from '@/modules/users/repos/implements/users.repo.impl';
import { TestHelper } from '~/common/helpers/test.helper';
import { createUserInfoRequest } from '~/unit-test/modules/users/stubs/user.stub';

describe('Users Repo', () => {
  let usersRepo: UsersRepo;
  let dbClientMock: IDBClient;

  const authUser: TAuthUser = {
    userId: 'user-id-1',
    username: 'username-1',
  };

  beforeAll(() => {
    const testModule = TestHelper.createTestingModule([
      {
        provide: DI.DB_CLIENT_DATASOURCE,
        useValue: {
          getClient: vi.fn(),
        },
      },
      UsersRepo,
    ]);

    usersRepo = testModule.get(UsersRepo);
    dbClientMock = testModule.get(DI.DB_CLIENT_DATASOURCE);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('saveUser should upsert user and return mapped payload', async () => {
    const userInfoDto = createUserInfoRequest();
    const mockClient = {
      user: {
        upsert: vi.fn().mockResolvedValue({
          gigyaUuid: authUser.userId,
          userNickname: userInfoDto.input.userNickname,
          cognitoId: null,
          createDatetime: new Date('2025-02-21T05:44:41.409Z'),
          createAuthor: authUser.userId,
          updateDatetime: new Date('2025-02-21T05:44:41.409Z'),
          updateAuthor: authUser.userId,
          deleteDatetime: null,
          deleteAuthor: null,
        }),
      },
    };

    (dbClientMock.getClient as Mock).mockResolvedValue(mockClient);

    const result = await usersRepo.saveUser(userInfoDto, authUser);

    expect(mockClient.user.upsert).toHaveBeenCalled();
    expect(result.gigyaUuid).toBe(authUser.userId);
    expect(result.userNickname).toBe('example_userNickname');
  });

  test('saveUser should throw when db throws', async () => {
    (dbClientMock.getClient as Mock).mockRejectedValue(new Error('Database connection failed'));

    await expect(usersRepo.saveUser(createUserInfoRequest(), authUser)).rejects.toThrow(
      'Database connection failed',
    );
  });
});
