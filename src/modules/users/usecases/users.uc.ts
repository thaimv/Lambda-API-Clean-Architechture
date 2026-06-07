import type { TAuthUser } from '@/common/types/app.type';
import type { CreateUserInfoRequest } from '@/modules/users/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/users/dtos/responses/create-user-info.response.dto';

export interface IUsersUseCase {
  saveUser(userInfo: CreateUserInfoRequest, authUser: TAuthUser): Promise<UserInfoResponse>;
}
