import { Module } from '@/common/decorators/module.decorator';
import { UserGraphController } from '@/modules/user/controllers/user.graph.controller';
import { UserRepo } from '@/modules/user/repos/implements/user.repo.impl';
import { UserUseCase } from '@/modules/user/usecases/implement/user.uc.impl';
import { USER_DI_CONST } from '@/modules/user/user.const';

@Module({
  controllers: [UserGraphController],
  providers: [
    {
      provide: USER_DI_CONST.IUserRepo,
      useClass: UserRepo,
    },
    {
      provide: USER_DI_CONST.IUserUseCase,
      useClass: UserUseCase,
    },
  ],
})
export class UserGraphModule {}
