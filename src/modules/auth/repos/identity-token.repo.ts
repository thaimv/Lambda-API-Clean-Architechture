import type { IdentityTokenResult } from '@/modules/auth/models/identity-token.model';

export interface IIdentityTokenRepo {
  getIdentityForUserPoolToken(idToken: string): Promise<IdentityTokenResult>;
}
