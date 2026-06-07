import { inject, injectable } from 'inversify';

import { RouteName } from '@/common/constants/graphql-api.const';
import { Route } from '@/common/decorators/route.decorator';
import { ValidationArgs } from '@/common/decorators/validation-args.decorator';
import type { TAuthUser } from '@/common/types/app.type';
import type { TRequestEvent } from '@/common/types/event.type';
import {
  createUserInfoDtoSchema,
  type CreateUserInfoRequest,
} from '@/modules/user/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/user/dtos/responses/create-user-info.response.dto';
import type { IUserUseCase } from '@/modules/user/usecases/user.uc';
import { USER_DI_CONST } from '@/modules/user/user.const';

@injectable()
export class UserGraphController {
  constructor(
    @inject(USER_DI_CONST.IUserUseCase)
    private readonly userUseCase: IUserUseCase,
  ) {}

  @Route(RouteName.CREATE_USER_INFO)
  @ValidationArgs(createUserInfoDtoSchema)
  async create(
    event: TRequestEvent<CreateUserInfoRequest>,
    authUser: TAuthUser,
  ): Promise<UserInfoResponse> {
    return this.userUseCase.saveUser(event.arguments, authUser);
  }
}
