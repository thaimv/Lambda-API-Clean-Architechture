import type { User } from '@/common/models/user.model';
import type { TAuthUser } from '@/common/types/app.type';
import type { CreateUserInfoRequest } from '@/modules/users/dtos/requests/create-user-info.request.dto';

export interface IUsersRepo {
  saveUser(params: CreateUserInfoRequest, authUser: TAuthUser): Promise<User>;
}
