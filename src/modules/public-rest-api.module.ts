import { DI } from '@/common/constants/di.const';
import { Module } from '@/common/decorators/module.decorator';
import { AppConfig } from '@/config/app.config';
import { CommonUserRepo } from '@/config/di/repos/user.di';
import { UsersRestModule } from '@/modules/users/users.rest.module';

@Module({
  imports: [CommonUserRepo, UsersRestModule],
  providers: [
    {
      provide: DI.APP_CONFIG,
      useClass: AppConfig,
    },
  ],
})
export class PublicRestApiModule {}
