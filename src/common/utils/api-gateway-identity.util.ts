import type { APIGatewayProxyEvent } from 'aws-lambda';

import { StringUtil } from '@/common/utils/string.util';

export type ApiGatewayIdentityWithAuthProvider =
  APIGatewayProxyEvent['requestContext']['identity'] & {
    cognitoIdentityAuthProvider?: string | null;
  };

export type RestApiAuthContext = {
  userId: string;
  username: string;
  cognitoIdentityId: string;
  cognitoAuthenticationProvider: string;
};

const getAuthorizerClaims = (event: APIGatewayProxyEvent): Record<string, string> | undefined => {
  const authorizer = (event.requestContext as { authorizer?: { claims?: Record<string, string> } })
    ?.authorizer;

  return authorizer?.claims;
};

/**
 * Extracts authenticated user context from API Gateway identity for REST routes.
 */
export const extractRestApiAuthContext = (event: APIGatewayProxyEvent): RestApiAuthContext => {
  const identity = (event.requestContext?.identity ?? {}) as ApiGatewayIdentityWithAuthProvider;
  const claims = getAuthorizerClaims(event);

  const authProviders = [
    identity.cognitoIdentityAuthProvider,
    identity.cognitoAuthenticationProvider,
  ].filter((value): value is string => Boolean(value));

  let userId = '';
  for (const provider of authProviders) {
    userId = StringUtil.getUserIdFromAuthenticationProvider(provider);
    if (userId) {
      break;
    }
  }

  if (!userId && claims?.sub) {
    userId = claims.sub;
  }

  let username = StringUtil.getUsernameFromIdentityUsername(identity.user ?? '');
  if (!username && claims?.['cognito:username']) {
    username = claims['cognito:username'];
  }

  const cognitoIdentityId = identity.cognitoIdentityId ?? '';
  const cognitoAuthenticationProvider = identity.cognitoAuthenticationProvider ?? '';

  return {
    userId,
    username,
    cognitoIdentityId,
    cognitoAuthenticationProvider,
  };
};
