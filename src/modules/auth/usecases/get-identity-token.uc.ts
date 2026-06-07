import type { IdentityTokenResult } from '@/modules/auth/models/identity-token.model';

export interface IGetIdentityTokenUseCase {
  execute(idToken: string): Promise<IdentityTokenResult>;
}
