import { Module } from '@/common/decorators/module.decorator';
import { UsersRestController } from '@/modules/users/controllers/users.rest.controller';
import { UsersRepo } from '@/modules/users/repos/implements/users.repo.impl';
import { UsersUseCase } from '@/modules/users/usecases/implement/users.uc.impl';
import { USERS_DI_CONST } from '@/modules/users/users.const';

@Module({
  controllers: [UsersRestController],
  providers: [
    {
      provide: USERS_DI_CONST.IUsersRepo,
      useClass: UsersRepo,
    },
    {
      provide: USERS_DI_CONST.IUsersUseCase,
      useClass: UsersUseCase,
    },
  ],
})
export class UsersRestModule {}
