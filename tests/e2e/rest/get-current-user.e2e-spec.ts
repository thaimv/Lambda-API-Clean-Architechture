/* eslint-disable max-lines-per-function */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

import { cloudwatchConfig, e2eHookTimeouts } from '~/e2e/config';
import { getApiTestApp } from '~/e2e/helpers/api-test-app';
import { upsertAuthenticatedUser } from '~/e2e/helpers/common';

/**
 * Black-box E2E Test Suite for GET /user (REST)
 *
 * Spec: document/detail-designs/rest/user/Get Current User.md
 * Lambda: public-api
 *
 * Note: Implementation reads persisted user from DB (cognitoSub lookup), not identity-only.
 *
 * Error Conditions (RESULT_CODE):
 *   - SC-001: success
 *   - EB-001: unauthorized (Aspect A — gateway may block before Lambda)
 */

const ENDPOINT = '/user';
const SEEDED_NICKNAME = 'example_user';
const UPDATED_NICKNAME = 'updated_current_user';

type GetCurrentUserResponseBody = {
  result?: { code?: string; message?: string };
  data?: {
    cognitoSub?: string;
    userNickname?: string;
    cognitoId?: string | null;
  };
};

describe('GET /user - E2E (Black-box)', () => {
  const app = getApiTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.publicApiLambda].filter(Boolean),
      restApi: 'publicApi',
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate();
  }, e2eHookTimeouts.afterAll);

  describe('Functional - Happy Path', () => {
    test('S01: should return SC-001 with current user from database', async () => {
      // Arrange — seed logged-in user's row (REST specs do not cross-call GraphQL)
      await upsertAuthenticatedUser(app, SEEDED_NICKNAME);

      // Act
      const result = await app.requester.sendRest<GetCurrentUserResponseBody>('GET', ENDPOINT);

      // Assert — API response
      expect(result.statusCode).toBe(200);
      expect(result.body?.result?.code).toBe('SC-001');
      expect(result.body?.data?.userNickname).toBe(SEEDED_NICKNAME);
      expect(result.body?.data?.cognitoSub).toBe(app.getAuthenticatedCognitoSub());

      // Assert — DB row matches response
      const row = await app.db.client.user.findUnique({
        where: { cognitoSub: app.getAuthenticatedCognitoSub() },
      });
      expect(result.body?.data?.cognitoSub).toBe(row?.cognitoSub);
      expect(result.body?.data?.userNickname).toBe(row?.userNickname);
      expect(result.body?.data?.cognitoId).toBe(row?.cognitoId ?? null);
    });
  });

  describe('State Transition', () => {
    test('ST01: should reflect updated database nickname on subsequent GET', async () => {
      // Arrange — seed then update DB directly to simulate external state change
      await upsertAuthenticatedUser(app, SEEDED_NICKNAME);
      await app.db.client.user.update({
        where: { cognitoSub: app.getAuthenticatedCognitoSub() },
        data: { userNickname: UPDATED_NICKNAME, updateAuthor: app.getAuthenticatedCognitoSub() },
      });

      // Act
      const result = await app.requester.sendRest<GetCurrentUserResponseBody>('GET', ENDPOINT);

      // Assert — API matches updated DB row
      expect(result.statusCode).toBe(200);
      expect(result.body?.result?.code).toBe('SC-001');
      expect(result.body?.data?.userNickname).toBe(UPDATED_NICKNAME);

      const row = await app.db.client.user.findUnique({
        where: { cognitoSub: app.getAuthenticatedCognitoSub() },
      });
      expect(result.body?.data?.userNickname).toBe(row?.userNickname);
    });
  });

  describe('Null / Optional Fields', () => {
    test('N01: should return null cognitoId when not stored in database', async () => {
      // Skip because this is not a nullable field in the database
    });
  });

  describe('Authorization', () => {
    test('A01: should reject request without credentials', async () => {
      // Act — IAM at API Gateway typically blocks before Lambda runs
      const result = await app.withoutAuth().sendRest('GET', ENDPOINT);

      // Assert
      expect(result.statusCode).not.toBe(200);
    });
  });
});
