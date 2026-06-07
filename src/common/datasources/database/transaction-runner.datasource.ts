import type { Prisma } from '@prisma/client';

export type IDatabaseSession = Prisma.TransactionClient;
export interface ITransactionRunnerDatasource {
  runInTransaction<T>(callback: (tx: IDatabaseSession) => Promise<T>): Promise<T>;
}
