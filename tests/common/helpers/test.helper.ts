import { Container } from 'inversify';
import 'reflect-metadata';

import type { RouteName } from '@/common/constants/graphql-api.const';
import type { TNewable, TProviderMetadata } from '@/common/types/app.type';
import type { TApiGatewayCustomEvent, TRequestEvent } from '@/common/types/event.type';

export class TestHelper {
  static createTestingModule(providers: TProviderMetadata[]) {
    const container = new Container();

    providers.forEach((provider) => {
      if ('useValue' in provider) {
        container.bind(provider.provide).toConstantValue(provider.useValue);
      } else if ('useClass' in provider && provider.useClass) {
        container.bind(provider.provide).to(provider.useClass).inSingletonScope();
      } else if ('useFactory' in provider && provider.useFactory) {
        container.bind(provider.provide).toDynamicValue(provider.useFactory);
      } else {
        container
          .bind(provider as TNewable<unknown>)
          .toSelf()
          .inSingletonScope();
      }
    });

    return {
      get: <T>(provider: string | symbol | TNewable<T>) => container.get<T>(provider),
    };
  }

  static createBasicAppSyncEvent<T>(params: {
    field: RouteName;
    arguments: T;
    gigyaUuid?: string;
  }): TRequestEvent<T> {
    return {
      field: params.field,
      arguments: params.arguments,
      source: {},
      identity: {
        accountId: 'test-account-id',
        cognitoIdentityId: 'test-cognito-id',
        cognitoIdentityAuthProvider: `"gigya.yta","gigya.yta:eu-west-1:0287e4c8-0ef4-4108-82f0-3171b6410fbd:${params.gigyaUuid ?? '301bbfe6b63a4d92810fa362a1a742a7'}"`,
        userArn: 'test-user-arn',
        username: 'test-user',
      },
    };
  }

  static createBasicAPIGatewayEvent<T>(params: {
    httpMethod: string;
    path: string;
    body: string;
    queryStringParameters?: unknown;
    pathParameters?: unknown;
    gigyaUuid: string;
  }): TApiGatewayCustomEvent<T> {
    return {
      httpMethod: params.httpMethod,
      path: params.path,
      body: JSON.parse(params.body),
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
      },
      isBase64Encoded: false,
      queryStringParameters: params.queryStringParameters,
      pathParameters: params.pathParameters,
      resource: params.path,
      authUser: { userId: params.gigyaUuid },
    };
  }
}
