import type { PrismaClient } from '@prisma/client';

export interface IDBClient {
  getClient(): Promise<PrismaClient>;
}
