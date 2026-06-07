import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/common/errors/notfound-error';
import type { TAuthUser } from '@/common/types/app.type';
import { UserRestController } from '@/modules/user/controllers/user.rest.controller';
import type { IUserUseCase } from '@/modules/user/usecases/user.uc';
import { createUserInfoResponseStub } from '~/unit-test/modules/user/stubs/user.stub';

describe('UserRestController', () => {
  let controller: UserRestController;
  let userUseCase: IUserUseCase;

  const authUser: TAuthUser = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    username: 'test-user',
  };

  beforeEach(() => {
    userUseCase = {
      saveUser: vi.fn(),
      getCurrentUser: vi.fn(),
    };
    controller = new UserRestController(userUseCase);
  });

  it('getCurrentUser returns user info from use case', async () => {
    const expected = createUserInfoResponseStub();
    vi.mocked(userUseCase.getCurrentUser).mockResolvedValue(expected);

    const result = await controller.getCurrentUser({} as never, authUser);

    expect(userUseCase.getCurrentUser).toHaveBeenCalledWith(authUser);
    expect(result).toEqual(expected);
  });

  it('getCurrentUser propagates NotFoundError from use case', async () => {
    vi.mocked(userUseCase.getCurrentUser).mockRejectedValue(
      new NotFoundError('Resource not found.'),
    );

    await expect(controller.getCurrentUser({} as never, authUser)).rejects.toThrow(NotFoundError);
  });
});
