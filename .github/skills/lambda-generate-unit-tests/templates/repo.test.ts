// @ts-nocheck — template file; path aliases resolve correctly in generated output under tests/
import 'reflect-metadata';
import { beforeAll, beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

import { DI } from '@/common/constants/di.const';
import type { IDBClientDatasource } from '@/common/datasources/database/db-client.datasource';
import type { TAuthUser } from '@/common/types/app.type';
import { <RepoClass> } from '@/modules/<module>/repos/implements/<name>.repo.impl';
import { TestHelper } from '~/common/helpers/test.helper';
import { create<Name>Request } from '~/unit-test/modules/<module>/stubs/<name>.stub';

const AUTH_USER: TAuthUser = {
  userId: 'user-id-1',
  username: 'test-user',
};

describe('<RepoClass>', () => {
  let repo: <RepoClass>;
  let dbClientMock: IDBClientDatasource;

  beforeAll(() => {
    const testModule = TestHelper.createTestingModule([
      {
        provide: DI.DB_CLIENT_DATASOURCE,
        useValue: { getClient: vi.fn() },
      },
      <RepoClass>,
    ]);

    repo = testModule.get(<RepoClass>);
    dbClientMock = testModule.get(DI.DB_CLIENT_DATASOURCE);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- Happy Path ---

  test('should call Prisma with correct query and return mapped result', async () => {
    // Arrange
    const request = create<Name>Request();
    const prismaRecord = {
      cognitoSub: AUTH_USER.userId,
      fieldOne: request.input.fieldOne,
      createdAt: new Date(),
    };
    const mockClient = {
      // Prisma model name (camelCase)
      tableName: { upsert: vi.fn().mockResolvedValue(prismaRecord) },
    };
    (dbClientMock.getClient as Mock).mockResolvedValue(mockClient);

    // Act
    const result = await repo.<repoMethod>(request, AUTH_USER);

    // Assert
    expect(mockClient.tableName.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({}),
        create: expect.objectContaining({}),
        update: expect.objectContaining({}),
      }),
    );
    expect(result.cognitoSub).toBe(AUTH_USER.userId);
  });

  // --- Error Propagation ---

  test('should propagate DB error', async () => {
    // Arrange
    (dbClientMock.getClient as Mock).mockRejectedValue(new Error('Database connection failed'));

    // Act & Assert
    await expect(repo.<repoMethod>(create<Name>Request(), AUTH_USER)).rejects.toThrow(
      'Database connection failed',
    );
  });
});
