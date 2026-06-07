import { Module } from '@/common/decorators/module.decorator';
import { AUTH_DI_CONST } from '@/modules/auth/auth.const';
import { AuthRestController } from '@/modules/auth/controllers/auth.rest.controller';
import { CognitoIdentityRepo } from '@/modules/auth/repos/implements/cognito-identity.repo.impl';
import { GetIdentityTokenUseCase } from '@/modules/auth/usecases/implement/get-identity-token.uc.impl';

@Module({
  controllers: [AuthRestController],
  providers: [
    {
      provide: AUTH_DI_CONST.IIdentityTokenRepo,
      useClass: CognitoIdentityRepo,
    },
    {
      provide: AUTH_DI_CONST.IGetIdentityTokenUseCase,
      useClass: GetIdentityTokenUseCase,
    },
  ],
})
export class AuthRestModule {}
