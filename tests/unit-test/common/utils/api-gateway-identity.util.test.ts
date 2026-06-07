import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, test } from 'vitest';

import { extractRestApiAuthContext } from '@/common/utils/api-gateway-identity.util';

const createEvent = (identity: Record<string, unknown>): APIGatewayProxyEvent =>
  ({
    requestContext: { identity },
  }) as APIGatewayProxyEvent;

describe('extractRestApiAuthContext', () => {
  test('should extract user id from Cognito User Pool provider', () => {
    const authContext = extractRestApiAuthContext(
      createEvent({
        cognitoAuthenticationProvider:
          'cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:550e8400-e29b-41d4-a716-446655440000',
        cognitoIdentityId: 'us-east-1:identity-id',
        user: 'XROA4XXXXXXYU3:CognitoIdentityCredentials',
      }),
    );

    expect(authContext).toEqual({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      username: 'XROA4XXXXXXYU3',
      cognitoIdentityId: 'us-east-1:identity-id',
      cognitoAuthenticationProvider:
        'cognito-idp.us-east-1.amazonaws.com/us-east-1_test:CognitoSignIn:550e8400-e29b-41d4-a716-446655440000',
    });
  });

  test('should extract gigya user id from cognitoIdentityAuthProvider', () => {
    const authContext = extractRestApiAuthContext(
      createEvent({
        cognitoIdentityAuthProvider:
          '"gigya.yta","gigya.yta:eu-west-1:0287e4c8-0ef4-4108-82f0-3171b6410fbd:97b2c826a87a45d89795259c5d9cba45"',
        cognitoAuthenticationProvider: 'gigya-provider',
        cognitoIdentityId: 'eu-west-1:0287e4c8-0ef4-4108-82f0-3171b6410fbd',
        user: 'XROA4XXXXXXYU3:CognitoIdentityCredentials',
      }),
    );

    expect(authContext.userId).toBe('97b2c826a87a45d89795259c5d9cba45');
  });

  test('should fall back to Cognito authorizer claims', () => {
    const authContext = extractRestApiAuthContext({
      requestContext: {
        identity: {
          cognitoIdentityId: 'us-east-1:identity-id',
          user: '',
        },
        authorizer: {
          claims: {
            sub: '550e8400-e29b-41d4-a716-446655440000',
            'cognito:username': 'demo-user',
          },
        },
      },
    } as APIGatewayProxyEvent);

    expect(authContext.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(authContext.username).toBe('demo-user');
  });

  test('should handle event without requestContext identity', () => {
    const authContext = extractRestApiAuthContext({} as APIGatewayProxyEvent);

    expect(authContext).toEqual({
      userId: '',
      username: '',
      cognitoIdentityId: '',
      cognitoAuthenticationProvider: '',
    });
  });

  test('should use claims username when identity user is missing', () => {
    const authContext = extractRestApiAuthContext({
      requestContext: {
        identity: {
          cognitoIdentityId: 'us-east-1:identity-id',
        },
        authorizer: {
          claims: {
            sub: '550e8400-e29b-41d4-a716-446655440000',
            'cognito:username': 'claims-user',
          },
        },
      },
    } as APIGatewayProxyEvent);

    expect(authContext.username).toBe('claims-user');
  });
});
