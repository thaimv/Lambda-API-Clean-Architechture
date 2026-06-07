import type { TAuthUser } from '@/common/types/app.type';
import type { CreateUserInfoRequest } from '@/modules/user/dtos/requests/create-user-info.request.dto';
import type { UserInfoResponse } from '@/modules/user/dtos/responses/create-user-info.response.dto';

export interface IUserUseCase {
  saveUser(userInfo: CreateUserInfoRequest, authUser: TAuthUser): Promise<UserInfoResponse>;
  getCurrentUser(authUser: TAuthUser): Promise<UserInfoResponse>;
}
