import type { User } from '@/common/models/user.model';
import type { TAuthUser } from '@/common/types/app.type';
import type { CreateUserInfoRequest } from '@/modules/user/dtos/requests/create-user-info.request.dto';

export interface IUserRepo {
  saveUser(params: CreateUserInfoRequest, authUser: TAuthUser): Promise<User>;
}
