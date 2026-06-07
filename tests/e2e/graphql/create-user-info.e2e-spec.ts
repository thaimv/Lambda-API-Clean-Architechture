/* eslint-disable max-lines-per-function */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

import { cloudwatchConfig, e2eHookTimeouts } from '~/e2e/config';
import { getApiTestApp } from '~/e2e/helpers/api-test-app';
import { expectUnauthorizedGraphQL } from '~/e2e/helpers/common';

/**
 * Black-box E2E Test Suite for createUserInfo (GraphQL)
 *
 * Spec: document/detail-designs/graphql/user/createUserInfo.md
 *
 * Business Logic:
 *   1. Validate userNickname (trimmed, min length 1)
 *   2. Reject nickname owned by another user (EB-009)
 *   3. Upsert user row keyed by cognitoSub
 *
 * Error Conditions (RESULT_CODE):
 *   - EB-004: validation failure
 *   - EB-009: nickname already taken by another user
 *   - EB-001 / UnauthorizedException: missing credentials (Aspect A)
 */

const VALID_NICKNAME = 'example_user';
const ALTERNATIVE_NICKNAME = 'bob';
const UPDATED_NICKNAME = 'updated_nickname';
const TAKEN_NICKNAME = 'taken_by_other_user';
const OTHER_USER_COGNITO_SUB = '00000000-0000-4000-8000-000000000001';

const CREATE_USER_INFO = `
  mutation CreateUserInfo($input: UserInfoInput!) {
    createUserInfo(input: $input) {
      cognitoSub
      userNickname
      cognitoId
    }
  }
`;

describe('createUserInfo - E2E (Black-box)', () => {
  const app = getApiTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.appsyncLambda].filter(Boolean),
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate();
  }, e2eHookTimeouts.afterAll);

  describe('Functional - Happy Path', () => {
    test('S01: should create user info with valid input', async () => {
      // Arrange
      const variables = { input: { userNickname: VALID_NICKNAME } };

      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

      // Assert — API response
      expect(result.errors).toBeUndefined();
      expect(result.data?.createUserInfo).toMatchObject({
        cognitoSub: app.getAuthenticatedCognitoSub(),
        userNickname: VALID_NICKNAME,
      });

      // Assert — DB row matches response
      const row = await app.db.client.user.findUnique({
        where: { cognitoSub: app.getAuthenticatedCognitoSub() },
      });
      expect(row?.userNickname).toBe(VALID_NICKNAME);
      expect(row?.cognitoSub).toBe(result.data!.createUserInfo!.cognitoSub);
    });

    test('S02: should update existing user nickname on second call (upsert)', async () => {
      // Arrange — establish initial nickname
      await app.requester.sendGraphQL(CREATE_USER_INFO, {
        input: { userNickname: 'initial_nickname' },
      });

      // Act — upsert with new nickname for same authenticated user
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
        input: { userNickname: UPDATED_NICKNAME },
      });

      // Assert
      expect(result.errors).toBeUndefined();
      expect(result.data?.createUserInfo?.userNickname).toBe(UPDATED_NICKNAME);

      const row = await app.db.client.user.findUnique({
        where: { cognitoSub: app.getAuthenticatedCognitoSub() },
      });
      expect(row?.userNickname).toBe(UPDATED_NICKNAME);
    });
  });

  describe('Negative - Error Handling', () => {
    test('E01: should return EB-004 when userNickname is empty', async () => {
      // Arrange
      const variables = { input: { userNickname: '' } };

      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

      // Assert
      expect(result.errors).toBeDefined();
      expect(result.errors![0].errorType).toBe('EB-004');
      expect(result.data?.createUserInfo).toBeFalsy();
    });

    test('E02: should return EB-009 when nickname belongs to another user', async () => {
      // Arrange — seed nickname owned by a different cognitoSub
      await app.db.client.user.upsert({
        where: { cognitoSub: OTHER_USER_COGNITO_SUB },
        update: { userNickname: TAKEN_NICKNAME, updateAuthor: OTHER_USER_COGNITO_SUB },
        create: {
          cognitoSub: OTHER_USER_COGNITO_SUB,
          userNickname: TAKEN_NICKNAME,
          createAuthor: OTHER_USER_COGNITO_SUB,
          updateAuthor: OTHER_USER_COGNITO_SUB,
        },
      });

      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
        input: { userNickname: TAKEN_NICKNAME },
      });

      // Assert
      expect(result.errors).toBeDefined();
      expect(result.errors![0].errorType).toBe('EB-009');
      expect(result.data?.createUserInfo).toBeFalsy();
    });
  });

  describe('Boundary Value Analysis', () => {
    test('B01: should accept userNickname at minimum valid length (1 char)', async () => {
      // Arrange
      const variables = { input: { userNickname: 'a' } };

      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

      // Assert
      expect(result.errors).toBeUndefined();
      expect(result.data?.createUserInfo?.userNickname).toBe('a');
    });

    test('B02: should return EB-004 when userNickname is empty after trim', async () => {
      // Arrange
      const variables = { input: { userNickname: '   ' } };

      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

      // Assert
      expect(result.errors).toBeDefined();
      expect(result.errors![0].errorType).toBe('EB-004');
    });
  });

  describe('Equivalence Partitioning', () => {
    test('EP01: should return EB-004 when userNickname is whitespace only', async () => {
      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
        input: { userNickname: ' \t\n ' },
      });

      // Assert
      expect(result.errors).toBeDefined();
      expect(result.errors![0].errorType).toBe('EB-004');
    });

    test('EP02: should succeed with a valid alternative nickname', async () => {
      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
        input: { userNickname: ALTERNATIVE_NICKNAME },
      });

      // Assert
      expect(result.errors).toBeUndefined();
      expect(result.data?.createUserInfo?.userNickname).toBe(ALTERNATIVE_NICKNAME);
    });
  });

  describe('State Transition', () => {
    test('ST01: should persist user info in the database after mutation', async () => {
      // Arrange
      const nickname = 'st01_persisted_user';
      const variables = { input: { userNickname: nickname } };

      // Act
      const mutation = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);
      expect(mutation.errors).toBeUndefined();

      // Assert — DB read-back matches mutation response
      const { cognitoSub, userNickname } = mutation.data!.createUserInfo!;
      const row = await app.db.client.user.findUnique({ where: { cognitoSub } });
      expect(row?.userNickname).toBe(userNickname);
      expect(row?.userNickname).toBe(nickname);
    });
  });

  describe('Null / Optional Fields', () => {
    test('N01: should return cognitoId from auth context when available', async () => {
      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
        input: { userNickname: 'n01_cognito_id_user' },
      });

      // Assert — nullable response field populated from identity when present
      expect(result.errors).toBeUndefined();
      expect(result.data?.createUserInfo?.cognitoId).toBeDefined();

      const row = await app.db.client.user.findUnique({
        where: { cognitoSub: app.getAuthenticatedCognitoSub() },
      });
      expect(row?.cognitoId).toBe(result.data?.createUserInfo?.cognitoId);
    });
  });

  describe('Idempotency', () => {
    test('I01: should succeed on duplicate call with same input (upsert)', async () => {
      // Arrange
      const variables = { input: { userNickname: 'i01_idempotent_user' } };
      await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

      // Assert — upsert allows repeat calls for the same user
      expect(result.errors).toBeUndefined();
      expect(result.data?.createUserInfo?.userNickname).toBe('i01_idempotent_user');
    });
  });

  describe('Authorization', () => {
    test('A01: should reject request without credentials', async () => {
      // Act
      const result = await app.withoutAuth().sendGraphQL(CREATE_USER_INFO, {
        input: { userNickname: VALID_NICKNAME },
      });

      // Assert
      expectUnauthorizedGraphQL(result);
      expect(result.data?.createUserInfo).toBeFalsy();
    });
  });
});
