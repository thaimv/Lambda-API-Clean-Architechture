import { inject, injectable } from 'inversify';

import { AUTH_DI_CONST } from '@/modules/auth/auth.const';
import type { IdentityTokenResult } from '@/modules/auth/models/identity-token.model';
import type { IIdentityTokenRepo } from '@/modules/auth/repos/identity-token.repo';
import type { IGetIdentityTokenUseCase } from '@/modules/auth/usecases/get-identity-token.uc';

@injectable()
export class GetIdentityTokenUseCase implements IGetIdentityTokenUseCase {
  constructor(
    @inject(AUTH_DI_CONST.IIdentityTokenRepo)
    private readonly identityTokenRepo: IIdentityTokenRepo,
  ) {}

  async execute(idToken: string): Promise<IdentityTokenResult> {
    return this.identityTokenRepo.getIdentityForUserPoolToken(idToken);
  }
}
