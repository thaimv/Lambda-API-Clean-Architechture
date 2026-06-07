import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import type { DBClient } from '@/common/datasources/database/implements/prisma-db-client.datasource.impl';
import type { User } from '@/common/models/user.model';
import type { IUserRepo } from '@/common/repos/user/user.repo';

@injectable()
export class UserRepo implements IUserRepo {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: DBClient,
  ) {}

  async getUserByNickname(userNickname: string): Promise<User | null> {
    const client = await this.dbClient.getClient();

    return client.user.findFirst({
      where: { userNickname },
    });
  }
}
