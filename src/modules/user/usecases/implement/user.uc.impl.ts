import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import { ERROR_MESSAGE } from '@/common/constants/response.const';
import { ExistedError } from '@/common/errors/existed-error';
import { NotFoundError } from '@/common/errors/notfound-error';
import type { IUserRepo as ICommonUserRepo } from '@/common/repos/user/user.repo';
import type { TAuthUser } from '@/common/types/app.type';
import type { CreateUserInfoRequest } from '@/modules/user/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/user/dtos/responses/create-user-info.response.dto';
import type { IUserRepo } from '@/modules/user/repos/user.repo';
import type { IUserUseCase } from '@/modules/user/usecases/user.uc';
import { USER_DI_CONST } from '@/modules/user/user.const';

@injectable()
export class UserUseCase implements IUserUseCase {
  constructor(
    @inject(DI.COMMON_USER_REPO)
    private readonly commonUserRepo: ICommonUserRepo,
    @inject(USER_DI_CONST.IUserRepo)
    private readonly userRepo: IUserRepo,
  ) {}

  async saveUser(userInfo: CreateUserInfoRequest, authUser: TAuthUser): Promise<UserInfoResponse> {
    const { input } = userInfo;
    const existingUser = await this.commonUserRepo.getUserByNickname(input.userNickname);

    if (existingUser && existingUser.cognitoSub !== authUser.userId) {
      throw new ExistedError(ERROR_MESSAGE.USER_NICKNAME_ALREADY_EXISTS);
    }

    const user = await this.userRepo.saveUser(userInfo, authUser);
    const response = {
      cognitoSub: user.cognitoSub,
      userNickname: user.userNickname,
      cognitoId: user.cognitoId,
    };

    return response;
  }

  async getCurrentUser(authUser: TAuthUser): Promise<UserInfoResponse> {
    const user = await this.commonUserRepo.getUserByCognitoSub(authUser.userId);

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGE.NOT_FOUND);
    }

    return {
      cognitoSub: user.cognitoSub,
      userNickname: user.userNickname,
      cognitoId: user.cognitoId,
    };
  }
}
