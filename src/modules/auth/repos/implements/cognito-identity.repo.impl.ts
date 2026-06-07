import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import type { ICognitoIdentityDatasource } from '@/common/datasources/cognito/cognito-identity.datasource';
import type { IdentityTokenResult } from '@/modules/auth/models/identity-token.model';
import type { IIdentityTokenRepo } from '@/modules/auth/repos/identity-token.repo';

@injectable()
export class CognitoIdentityRepo implements IIdentityTokenRepo {
  constructor(
    @inject(DI.COGNITO_IDENTITY_DATASOURCE)
    private readonly cognitoIdentityDatasource: ICognitoIdentityDatasource,
  ) {}

  async getIdentityForUserPoolToken(idToken: string): Promise<IdentityTokenResult> {
    return this.cognitoIdentityDatasource.getIdentityForUserPoolToken(idToken);
  }
}
