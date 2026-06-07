import type {
  DeleteIdentitiesOutput,
  GetOpenIdTokenOutput,
} from '@/common/types/datasources/cognito.type';

/**
 * Interface for Cognito Identity datasource operations
 */
export interface ICognitoIdentityDatasource {
  /**
   * Delete Cognito identities
   * @param identityIds - List of Identity IDs to delete
   * @returns Promise resolving to DeleteIdentitiesOutput
   */
  deleteIdentities(identityIds: string[]): Promise<DeleteIdentitiesOutput>;

  /**
   * Get an OpenID token for a developer-authenticated identity
   * @param sub - The user subject identifier (from JWT)
   * @returns Promise resolving to identityId and token
   */
  getOpenIdToken(sub: string): Promise<GetOpenIdTokenOutput>;

  /**
   * Resolve a Cognito Identity Pool identity from a User Pool ID token.
   */
  getIdentityForUserPoolToken(idToken: string): Promise<GetOpenIdTokenOutput>;
}
