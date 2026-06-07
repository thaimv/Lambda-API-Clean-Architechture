import { inject, injectable } from 'inversify';

import { PRISMA_TRANSACTION_CONFIG } from '@/common/constants/app.const';
import { DI } from '@/common/constants/di.const';
import type { PrismaDBClientDatasource } from '@/common/datasources/database/implements/prisma-db-client.datasource.impl';
import type {
  IDatabaseSession,
  ITransactionRunnerDatasource,
} from '@/common/datasources/database/transaction-runner.datasource';

@injectable()
export class PrismaTransactionRunnerDatasource implements ITransactionRunnerDatasource {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: PrismaDBClientDatasource,
  ) {}

  async runInTransaction<T>(callback: (tx: IDatabaseSession) => Promise<T>): Promise<T> {
    const prisma = await this.dbClient.getClient();
    return prisma.$transaction(async (tx) => callback(tx), {
      maxWait: PRISMA_TRANSACTION_CONFIG.MAX_WAIT,
      timeout: PRISMA_TRANSACTION_CONFIG.TIMEOUT,
    });
  }
}
