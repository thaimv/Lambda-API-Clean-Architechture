import { DI } from '@/common/constants/di.const';
import { Module } from '@/common/decorators/module.decorator';
import { AppConfig } from '@/config/app.config';
import { CognitoIdentityDatasourceModule } from '@/config/di/datasources/cognito-identity.di';
import { AuthRestModule } from '@/modules/auth/auth.rest.module';

@Module({
  imports: [CognitoIdentityDatasourceModule, AuthRestModule],
  providers: [
    {
      provide: DI.APP_CONFIG,
      useClass: AppConfig,
    },
  ],
})
export class AuthApiModule {}
