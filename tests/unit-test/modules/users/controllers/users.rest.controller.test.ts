import { describe, expect, test } from 'vitest';

import { UsersRestController } from '@/modules/users/controllers/users.rest.controller';

describe('UsersRestController', () => {
  const controller = new UsersRestController();

  test('getCurrentUser returns auth and identity fields from event', async () => {
    const result = await controller.getCurrentUser({
      authUser: {
        userId: 'gigya-123',
        username: 'test-user',
      },
      identity: {
        cognitoIdentityId: 'cognito-456',
      },
    });

    expect(result).toEqual({
      gigyaUuid: 'gigya-123',
      username: 'test-user',
      cognitoIdentityId: 'cognito-456',
    });
  });

  test('getCurrentUser defaults missing fields to null', async () => {
    const result = await controller.getCurrentUser({});

    expect(result).toEqual({
      gigyaUuid: null,
      username: null,
      cognitoIdentityId: null,
    });
  });
});
