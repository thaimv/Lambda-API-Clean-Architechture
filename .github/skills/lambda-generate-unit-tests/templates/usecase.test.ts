// @ts-nocheck — template file; path aliases resolve correctly in generated output under tests/
import 'reflect-metadata';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { ExistedError } from '@/common/errors/existed-error';
import { NotFoundError } from '@/common/errors/notfound-error';
import type { IUserRepo } from '@/common/repos/user/user.repo';
import type { TAuthUser } from '@/common/types/app.type';
import { <RepoClass> } from '@/modules/<module>/repos/implements/<name>.repo.impl';
import { <UseCaseClass> } from '@/modules/<module>/usecases/implement/<name>.uc.impl';
import { <MODULE>_DI_CONST } from '@/modules/<module>/<module>.const';
import { DI } from '@/common/constants/di.const';
import { TestHelper } from '~/common/helpers/test.helper';
import { create<Name>Stub, create<Name>Request } from '~/unit-test/modules/<module>/stubs/<name>.stub';

const AUTH_USER: TAuthUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  username: 'test-user',
};

describe('<UseCaseClass>', () => {
  let useCase: <UseCaseClass>;
  let repo: <RepoClass>;
  let commonUserRepo: IUserRepo;

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
        useValue: { getClient: vi.fn() },
      },
      {
        provide: <MODULE>_DI_CONST.I<RepoInterface>,
        useClass: <RepoClass>,
      },
      <UseCaseClass>,
    ]);

    useCase = testModule.get(<UseCaseClass>);
    repo = testModule.get(<MODULE>_DI_CONST.I<RepoInterface>);
    commonUserRepo = testModule.get(DI.COMMON_USER_REPO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Happy Path ---

  test('should <expected outcome> with valid input', async () => {
    // Arrange
    const request = create<Name>Request();
    const stub = create<Name>Stub();
    vi.spyOn(repo, '<repoMethod>').mockResolvedValue(stub);

    // Act
    const result = await useCase.<methodName>(request, AUTH_USER);

    // Assert
    expect(repo.<repoMethod>).toHaveBeenCalledWith(request, AUTH_USER);
    expect(result).toMatchObject({ fieldOne: stub.fieldOne });
  });

  // --- Not Found ---

  test('should throw NotFoundError when resource does not exist', async () => {
    // Arrange
    vi.spyOn(commonUserRepo, 'getUserByCognitoSub').mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.<methodName>({}, AUTH_USER)).rejects.toThrow(NotFoundError);
  });

  // --- Conflict ---

  test('should throw ExistedError when resource belongs to another user', async () => {
    // Arrange
    vi.spyOn(commonUserRepo, 'getUserByNickname').mockResolvedValue({
      ...create<Name>Stub(),
      cognitoSub: 'another-user-id',
    });

    // Act & Assert
    await expect(useCase.<methodName>(create<Name>Request(), AUTH_USER)).rejects.toThrow(ExistedError);
  });

  // --- Error Propagation ---

  test('should propagate unexpected repo error', async () => {
    // Arrange
    vi.spyOn(repo, '<repoMethod>').mockRejectedValue(new Error('DB connection failed'));

    // Act & Assert
    await expect(useCase.<methodName>(create<Name>Request(), AUTH_USER)).rejects.toThrow(
      'DB connection failed',
    );
  });
});
