import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import type { PrismaDBClientDatasource } from '@/common/datasources/database/implements/prisma-db-client.datasource.impl';
import type { User } from '@/common/models/user.model';
import type { TAuthUser } from '@/common/types/app.type';
import type { CreateUserInfoRequest } from '@/modules/user/dtos/requests/create-user-info.request.dto';
import type { IUserRepo } from '@/modules/user/repos/user.repo';

@injectable()
export class UserRepo implements IUserRepo {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: PrismaDBClientDatasource,
  ) {}

  async saveUser(params: CreateUserInfoRequest, authUser: TAuthUser): Promise<User> {
    const { input } = params;
    const client = await this.dbClient.getClient();
    const userData = {
      userNickname: input.userNickname,
      cognitoId: authUser.cognitoIdentityId || null,
      updateDatetime: new Date(),
      updateAuthor: authUser.userId,
    };

    return await client.user.upsert({
      where: { cognitoSub: authUser.userId },
      update: userData,
      create: {
        ...userData,
        cognitoSub: authUser.userId,
        createDatetime: new Date(),
        createAuthor: authUser.userId,
      },
    });
  }
}
