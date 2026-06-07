import type { PrismaClient } from '@prisma/client';

export interface IDBClientDatasource {
  getClient(): Promise<PrismaClient>;
}
