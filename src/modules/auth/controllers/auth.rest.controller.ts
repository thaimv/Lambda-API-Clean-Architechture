import { inject, injectable } from 'inversify';

import { PathAuthApi } from '@/common/constants/rest-api.const';
import { Post } from '@/common/decorators/rest-api-route.decorator';
import { BadRequestError } from '@/common/errors/bad-request-error';
import { ValidationError } from '@/common/errors/validation-error';
import type { TApiGatewayCustomEvent } from '@/common/types/event.type';
import { getAccessTokenFromRequest } from '@/common/utils/access-token.util';
import { AUTH_DI_CONST } from '@/modules/auth/auth.const';
import { GetIdentityTokenRequestSchema } from '@/modules/auth/dtos/requests/get-identity-token.request.dto';
import type { IGetIdentityTokenUseCase } from '@/modules/auth/usecases/get-identity-token.uc';

@injectable()
export class AuthRestController {
  constructor(
    @inject(AUTH_DI_CONST.IGetIdentityTokenUseCase)
    private readonly getIdentityTokenUseCase: IGetIdentityTokenUseCase,
  ) {}

  @Post(PathAuthApi.PostCredential)
  async postCredential(event: TApiGatewayCustomEvent<unknown>) {
    const token = getAccessTokenFromRequest(event);

    if (!token) {
      throw new BadRequestError('Missing access token');
    }

    try {
      JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch {
      throw new BadRequestError('Invalid access token');
    }

    const parsed = GetIdentityTokenRequestSchema.safeParse({ idToken: token });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    return this.getIdentityTokenUseCase.execute(parsed.data.idToken);
  }
}
