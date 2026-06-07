import { inject, injectable } from 'inversify';

import { RouteName } from '@/common/constants/graphql-api.const';
import { Route } from '@/common/decorators/route.decorator';
import { ValidationArgs } from '@/common/decorators/validation-args.decorator';
import type { TAuthUser } from '@/common/types/app.type';
import type { TRequestEvent } from '@/common/types/event.type';
import {
  createUserInfoDtoSchema,
  type CreateUserInfoRequest,
} from '@/modules/users/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/users/dtos/responses/create-user-info.response.dto';
import type { IUsersUseCase } from '@/modules/users/usecases/users.uc';
import { USERS_DI_CONST } from '@/modules/users/users.const';

@injectable()
export class UsersGraphController {
  constructor(
    @inject(USERS_DI_CONST.IUsersUseCase)
    private readonly usersUseCase: IUsersUseCase,
  ) {}

  @Route(RouteName.CREATE_USER_INFO)
  @ValidationArgs(createUserInfoDtoSchema)
  async create(
    event: TRequestEvent<CreateUserInfoRequest>,
    authUser: TAuthUser,
  ): Promise<UserInfoResponse> {
    return this.usersUseCase.saveUser(event.arguments, authUser);
  }
}
