import type { User } from '@/common/models/user.model';

export interface IUserRepo {
  getUserByNickname(userNickname: string): Promise<User | null>;
}
