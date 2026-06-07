import { injectable } from 'inversify';

import { PathPublicRestApi } from '@/common/constants/rest-api.const';
import { Get } from '@/common/decorators/rest-api-route.decorator';

@injectable()
export class UsersRestController {
  /**
   * Get currently authenticated user info from API Gateway identity context.
   */
  @Get(PathPublicRestApi.GetCurrentUser)
  async getCurrentUser(event: any) {
    return {
      gigyaUuid: event.authUser?.userId ?? null,
      username: event.authUser?.username ?? null,
      cognitoIdentityId: event.identity?.cognitoIdentityId ?? null,
    };
  }
}
