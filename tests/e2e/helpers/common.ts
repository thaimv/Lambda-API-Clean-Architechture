import { expect } from 'vitest';

import type { ApiTestApp } from '~/e2e/helpers/api-test-app';
import type { GraphQLResponse } from '~/e2e/helpers/graphql';

/**
 * GraphQL unauthorized responses depend on where auth fails:
 * - AppSync (IAM / no credentials): errorType `UnauthorizedException` — Lambda never runs
 * - Lambda (missing identity in resolver context): errorType `EB-001`
 */
export const GRAPHQL_UNAUTHORIZED_ERROR_TYPES = ['EB-001', 'UnauthorizedException'] as const;

export function expectUnauthorizedGraphQL(result: GraphQLResponse): void {
  expect(result.errors).toBeDefined();
  expect(result.errors!.length).toBeGreaterThan(0);
  expect(GRAPHQL_UNAUTHORIZED_ERROR_TYPES).toContain(result.errors![0].errorType);
}

/** Seed the logged-in test user's row — use for REST E2E instead of cross-calling GraphQL. */
export async function upsertAuthenticatedUser(
  app: ApiTestApp,
  userNickname: string,
): Promise<string> {
  const cognitoSub = app.getAuthenticatedCognitoSub();
  await app.db.client.user.upsert({
    where: { cognitoSub },
    update: { userNickname, updateAuthor: cognitoSub },
    create: {
      cognitoSub,
      userNickname,
      createAuthor: cognitoSub,
      updateAuthor: cognitoSub,
    },
  });
  return cognitoSub;
}

// ===== Common regex patterns =====
export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const AWS_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
