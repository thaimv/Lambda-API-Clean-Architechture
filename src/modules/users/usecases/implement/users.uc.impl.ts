import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import { ERROR_MESSAGE } from '@/common/constants/response.const';
import { ExistedError } from '@/common/errors/existed-error';
import type { IUserRepo } from '@/common/repos/user/user.repo';
import type { TAuthUser } from '@/common/types/app.type';
import type { CreateUserInfoRequest } from '@/modules/users/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/users/dtos/responses/create-user-info.response.dto';
import type { IUsersRepo } from '@/modules/users/repos/users.repo';
import type { IUsersUseCase } from '@/modules/users/usecases/users.uc';
import { USERS_DI_CONST } from '@/modules/users/users.const';

@injectable()
export class UsersUseCase implements IUsersUseCase {
  constructor(
    @inject(DI.COMMON_USER_REPO)
    private readonly userRepo: IUserRepo,
    @inject(USERS_DI_CONST.IUsersRepo)
    private readonly usersRepo: IUsersRepo,
  ) {}

  async saveUser(userInfo: CreateUserInfoRequest, authUser: TAuthUser): Promise<UserInfoResponse> {
    const { input } = userInfo;
    const existingUser = await this.userRepo.getUserByNickname(input.userNickname);

    if (existingUser && existingUser.gigyaUuid !== authUser.userId) {
      throw new ExistedError(ERROR_MESSAGE.USER_NICKNAME_ALREADY_EXISTS);
    }

    const user = await this.usersRepo.saveUser(userInfo, authUser);
    const response = {
      gigyaUuid: user.gigyaUuid,
      userNickname: user.userNickname,
      cognitoId: user.cognitoId,
    };

    return response;
  }
}
