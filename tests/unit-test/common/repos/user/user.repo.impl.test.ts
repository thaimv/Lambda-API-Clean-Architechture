import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IDBClient } from '@/common/datasources/database/db-client.datasource';
import { UserRepo } from '@/common/repos/user/implements/user.repo.impl';

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

describe('UserRepo', () => {
  let repo: UserRepo;
  let mockDBClient: IDBClient;
  let mockPrismaClient: { user: { findFirst: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    mockPrismaClient = {
      user: {
        findFirst: vi.fn(),
      },
    };

    mockDBClient = {
      getClient: vi.fn().mockResolvedValue(mockPrismaClient),
    } as unknown as IDBClient;

    repo = new UserRepo(mockDBClient as never);
  });

  describe('getUserByNickname', () => {
    it('returns user when found by nickname', async () => {
      const mockUser = {
        gigyaUuid: 'gigya-001',
        userNickname: 'example_user',
        cognitoId: 'cognito-001',
        createDatetime: new Date('2024-01-01T00:00:00.000Z'),
        createAuthor: 'system',
        updateDatetime: new Date('2024-01-02T00:00:00.000Z'),
        updateAuthor: 'system',
        deleteDatetime: null,
        deleteAuthor: null,
      };
      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser);

      const result = await repo.getUserByNickname('example_user');

      expect(mockPrismaClient.user.findFirst).toHaveBeenCalledWith({
        where: { userNickname: 'example_user' },
      });
      expect(result).toEqual(mockUser);
    });

    it('returns null when user is not found', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null);

      const result = await repo.getUserByNickname('missing_user');

      expect(result).toBeNull();
    });
  });
});
