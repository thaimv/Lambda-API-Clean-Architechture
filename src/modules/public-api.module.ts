import { DI } from '@/common/constants/di.const';
import { Module } from '@/common/decorators/module.decorator';
import { AppConfig } from '@/config/app.config';
import { CommonUserRepo } from '@/config/di/repos/user.di';
import { UserRestModule } from '@/modules/user/user.rest.module';

@Module({
  imports: [CommonUserRepo, UserRestModule],
  providers: [
    {
      provide: DI.APP_CONFIG,
      useClass: AppConfig,
    },
  ],
})
export class PublicApiModule {}
