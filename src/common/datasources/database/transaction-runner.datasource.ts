import type { Prisma } from '@prisma/client';

export type IDatabaseSession = Prisma.TransactionClient;
export interface ITransactionRunner {
  runInTransaction<T>(callback: (tx: IDatabaseSession) => Promise<T>): Promise<T>;
}
