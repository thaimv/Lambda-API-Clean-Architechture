import { DI } from '@/common/constants/di.const';
import { DBClient } from '@/common/datasources/database/implements/prisma-db-client.datasource.impl';
import { PrismaTransactionRunner } from '@/common/datasources/database/implements/prisma-transaction-runner.datasource.impl';
import { Module } from '@/common/decorators/module.decorator';
import { SecretsManagerDatasourceModule } from '@/config/di/datasources/secrets-manager.di';

@Module({
  imports: [SecretsManagerDatasourceModule],
  providers: [
    {
      provide: DI.DB_CLIENT_DATASOURCE,
      useClass: DBClient,
    },
    {
      provide: DI.TRANSACTION_RUNNER_DATASOURCE,
      useClass: PrismaTransactionRunner,
    },
  ],
})
export class DatabaseDatasourceModule {}
