import {
  CognitoIdentityClient,
  DeleteIdentitiesCommand,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity';
import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import type { ICognitoIdentityDatasource } from '@/common/datasources/cognito/cognito-identity.datasource';
import type {
  DeleteIdentitiesOutput,
  GetOpenIdTokenOutput,
} from '@/common/types/datasources/cognito.type';
import type { AppConfig } from '@/config/app.config';

/**
 * Implementation of Cognito Identity datasource
 */
@injectable()
export class CognitoIdentityDatasource implements ICognitoIdentityDatasource {
  private readonly client: CognitoIdentityClient;

  constructor(
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
    client?: CognitoIdentityClient,
  ) {
    this.client =
      client ??
      new CognitoIdentityClient({
        region: appConfig.awsConfig.region,
      });
  }

  /**
   * Delete Cognito identities
   */
  async deleteIdentities(identityIds: string[]): Promise<DeleteIdentitiesOutput> {
    return this.client.send(
      new DeleteIdentitiesCommand({
        IdentityIdsToDelete: identityIds,
      }),
    );
  }

  /**
   * Get an OpenID token for a developer-authenticated identity
   */
  async getOpenIdToken(sub: string): Promise<GetOpenIdTokenOutput> {
    const { identityPoolId, providerName, tokenDurationSeconds } =
      this.appConfig.cognitoIdentityConfig;

    const response = await this.client.send(
      new GetOpenIdTokenForDeveloperIdentityCommand({
        IdentityPoolId: identityPoolId,
        Logins: {
          [providerName]: sub,
        },
        TokenDuration: tokenDurationSeconds,
      }),
    );

    return {
      identityId: response.IdentityId ?? '',
      token: response.Token ?? '',
    };
  }
}
