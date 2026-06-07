import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IDBClientDatasource } from '@/common/datasources/database/db-client.datasource';
import { UserRepo } from '@/common/repos/user/implements/user.repo.impl';

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

describe('UserRepo', () => {
  let repo: UserRepo;
  let mockDBClient: IDBClientDatasource;
  let mockPrismaClient: { user: { findFirst: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    mockPrismaClient = {
      user: {
        findFirst: vi.fn(),
      },
    };

    mockDBClient = {
      getClient: vi.fn().mockResolvedValue(mockPrismaClient),
    } as unknown as IDBClientDatasource;

    repo = new UserRepo(mockDBClient as never);
  });

  describe('getUserByNickname', () => {
    it('returns user when found by nickname', async () => {
      const mockUser = {
        cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
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

  describe('getUserByCognitoSub', () => {
    it('returns active user when found by cognitoSub', async () => {
      const mockUser = {
        cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
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

      const result = await repo.getUserByCognitoSub(mockUser.cognitoSub);

      expect(mockPrismaClient.user.findFirst).toHaveBeenCalledWith({
        where: {
          cognitoSub: mockUser.cognitoSub,
          deleteDatetime: null,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('returns null when user is not found', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null);

      const result = await repo.getUserByCognitoSub('missing-sub');

      expect(result).toBeNull();
    });
  });
});
