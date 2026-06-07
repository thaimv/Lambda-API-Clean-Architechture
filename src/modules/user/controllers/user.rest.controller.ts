import { inject, injectable } from 'inversify';

import { PathPublicApi } from '@/common/constants/rest-api.const';
import { Get } from '@/common/decorators/rest-api-route.decorator';
import type { TAuthUser } from '@/common/types/app.type';
import type { TApiGatewayCustomEvent } from '@/common/types/event.type';
import type { UserInfoResponse } from '@/modules/user/dtos/responses/create-user-info.response.dto';
import type { IUserUseCase } from '@/modules/user/usecases/user.uc';
import { USER_DI_CONST } from '@/modules/user/user.const';

@injectable()
export class UserRestController {
  constructor(
    @inject(USER_DI_CONST.IUserUseCase)
    private readonly userUseCase: IUserUseCase,
  ) {}

  /**
   * Get currently authenticated user info from the database.
   */
  @Get(PathPublicApi.GetCurrentUser)
  async getCurrentUser(
    _event: TApiGatewayCustomEvent<unknown>,
    authUser: TAuthUser,
  ): Promise<UserInfoResponse> {
    return this.userUseCase.getCurrentUser(authUser);
  }
}
