import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { IIdentityTokenRepo } from '@/modules/auth/repos/identity-token.repo';
import { GetIdentityTokenUseCase } from '@/modules/auth/usecases/implement/get-identity-token.uc.impl';

describe('GetIdentityTokenUseCase', () => {
  const mockRepo: IIdentityTokenRepo = {
    getIdentityForUserPoolToken: vi.fn(),
  };

  let useCase: GetIdentityTokenUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetIdentityTokenUseCase(mockRepo);
  });

  test('executes repo with id token', async () => {
    const expected = { identityId: 'pool-id', token: 'id-token' };
    vi.mocked(mockRepo.getIdentityForUserPoolToken).mockResolvedValue(expected);

    const result = await useCase.execute('id-token');

    expect(mockRepo.getIdentityForUserPoolToken).toHaveBeenCalledWith('id-token');
    expect(result).toEqual(expected);
  });
});
