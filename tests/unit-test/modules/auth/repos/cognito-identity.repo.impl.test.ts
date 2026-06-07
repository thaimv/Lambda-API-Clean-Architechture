import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ICognitoIdentityDatasource } from '@/common/datasources/cognito/cognito-identity.datasource';
import { CognitoIdentityRepo } from '@/modules/auth/repos/implements/cognito-identity.repo.impl';

describe('CognitoIdentityRepo', () => {
  const mockDatasource: ICognitoIdentityDatasource = {
    deleteIdentities: vi.fn(),
    getOpenIdToken: vi.fn(),
    getIdentityForUserPoolToken: vi.fn(),
  };

  let repo: CognitoIdentityRepo;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new CognitoIdentityRepo(mockDatasource);
  });

  test('delegates getIdentityForUserPoolToken to cognito identity datasource', async () => {
    const expected = { identityId: 'id-1', token: 'id-token' };
    vi.mocked(mockDatasource.getIdentityForUserPoolToken).mockResolvedValue(expected);

    const result = await repo.getIdentityForUserPoolToken('id-token');

    expect(mockDatasource.getIdentityForUserPoolToken).toHaveBeenCalledWith('id-token');
    expect(result).toEqual(expected);
  });
});
