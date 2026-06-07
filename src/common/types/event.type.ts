import type { APIGatewayEventIdentity } from 'aws-lambda';

import type { RouteName } from '@/common/constants/graphql-api.const';
import type { TAuthUser } from '@/common/types/app.type';

/**
 * @description AppSync request event passed to lambda function
 */
export type TRequestEvent<P> = {
  field: RouteName;
  arguments: P;
  source?: unknown;
  parentTypeName?: string;
  variables?: { [key: string]: unknown };
  selectionSetList?: string[];
  selectionSetGraphQL?: string;
  identity: {
    accountId: string;
    cognitoIdentityAuthProvider: string;
    cognitoIdentityAuthType?: string;
    cognitoIdentityId: string;
    cognitoIdentityPoolId?: string;
    // concertoAuthenticationProvider?: string;
    sourceIp?: string[];
    userArn: string;
    username: string;
  };
  request: {
    headers: {
      'x-forwarded-for': string;
      'x-amzn-requestid': string;
      'user-agent': string;
      [key: string]: string;
    };
  };
};

/**
 * Custom event type from API Gateway with lambda proxy integration
 */
export type TApiGatewayCustomEvent<B> = {
  body: B;
  queryStringParameters: unknown;
  pathParameters: unknown;
  resource: string;
  path: string;
  authUser: TAuthUser;
  headers: { [name: string]: string | undefined };
  httpMethod: string;
  isBase64Encoded: boolean;
  identity: APIGatewayEventIdentity;
};
