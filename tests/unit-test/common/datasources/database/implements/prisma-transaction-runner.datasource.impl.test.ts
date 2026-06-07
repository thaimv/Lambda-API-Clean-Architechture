import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IDBClient } from '@/common/datasources/database/db-client.datasource';
import { PrismaTransactionRunner } from '@/common/datasources/database/implements/prisma-transaction-runner.datasource.impl';

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

describe('PrismaTransactionRunner', () => {
  let runner: PrismaTransactionRunner;
  let transactionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    transactionMock = vi.fn(async (callback: (tx: object) => Promise<unknown>) =>
      callback({ user: { deleteMany: vi.fn() } }),
    );

    const dbClient = {
      getClient: vi.fn().mockResolvedValue({
        $transaction: transactionMock,
      }),
    } as unknown as IDBClient;

    runner = new PrismaTransactionRunner(dbClient);
  });

  it('runs callback inside prisma transaction', async () => {
    const callback = vi.fn(async () => 'done');

    const result = await runner.runInTransaction(callback);

    expect(result).toBe('done');
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });
});
