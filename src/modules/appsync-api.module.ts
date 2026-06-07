import { DI } from '@/common/constants/di.const';
import { Module } from '@/common/decorators/module.decorator';
import { AppConfig } from '@/config/app.config';
import { CommonUserRepo } from '@/config/di/repos/user.di';
import { UsersGraphModule } from '@/modules/users/users.graph.module';

@Module({
  imports: [CommonUserRepo, UsersGraphModule],
  providers: [
    {
      provide: DI.APP_CONFIG,
      useClass: AppConfig,
    },
  ],
})
export class AppsyncApiModule {}
