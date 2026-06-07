import { DI } from '@/common/constants/di.const';
import { CognitoIdentityDatasource } from '@/common/datasources/cognito/implements/cognito-identity.datasource.impl';
import { Module } from '@/common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.COGNITO_IDENTITY_DATASOURCE,
      useClass: CognitoIdentityDatasource,
    },
  ],
})
export class CognitoIdentityDatasourceModule {}
