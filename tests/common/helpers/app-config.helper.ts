import { APP_CONST } from '@/common/constants/app.const';
import type { AppConfig } from '@/config/app.config';

type MockAppConfigOptions = {
  nodeEnv?: string;
  region?: string;
  dynamoEndpoint?: string;
  gcsSecretName?: string;
  rdsSecretArn?: string;
  dbUrl?: string;
  dbUrlReplica?: string;
  maxRetries?: number;
  backOffMs?: number;
  connectionLimit?: number;
  proxyEndpoint?: string;
  proxyEndpointReplica?: string;
  elastiCacheHost?: string;
  elastiCachePort?: number;
  elastiCacheTtl?: number;
  cognitoIdentityPoolId?: string;
  cognitoProviderName?: string;
  cognitoUserPoolId?: string;
  cognitoUserPoolRegion?: string;
  tokenDurationSeconds?: number;
};

export function createMockAppConfig(options: MockAppConfigOptions = {}): AppConfig {
  const nodeEnv = options.nodeEnv ?? APP_CONST.ENVIRONMENTS.TEST;

  return {
    get nodeEnv() {
      return nodeEnv;
    },
    get isProduction() {
      return nodeEnv === APP_CONST.ENVIRONMENTS.PROD;
    },
    get isDevelopment() {
      return nodeEnv === APP_CONST.ENVIRONMENTS.DEV;
    },
    get isLocal() {
      return nodeEnv === APP_CONST.ENVIRONMENTS.LOCAL;
    },
    get isTest() {
      return nodeEnv === APP_CONST.ENVIRONMENTS.TEST;
    },
    get dbConfig() {
      return {
        dbUrl: options.dbUrl ?? 'postgresql://user:pass@localhost:5432/db',
        dbUrlReplica: options.dbUrlReplica ?? 'postgresql://user:pass@localhost:5432/db',
        proxyEndpoint: options.proxyEndpoint ?? 'proxy.example.com',
        proxyEndpointReplica: options.proxyEndpointReplica ?? 'proxy.example.com',
        maxRetries: options.maxRetries ?? 3,
        backOffMs: options.backOffMs ?? 1000,
        connectionLimit: options.connectionLimit ?? 3,
      };
    },
    get awsConfig() {
      return { region: options.region ?? 'eu-west-1' };
    },
    get secretManagerKeys() {
      return {
        RDS_SECRET_ARN: options.rdsSecretArn ?? 'test-rds-secret',
        GCS_SECRET_NAME: options.gcsSecretName ?? 'test-gcs-secret',
      };
    },
    get dynamoDBConfig() {
      return { endpoint: options.dynamoEndpoint ?? 'http://localhost:8000' };
    },
    get lambdaConfig() {
      return {
        retryCount: '3',
        graphqlApiArn: 'arn:aws:lambda:eu-west-1:123456789012:function:test',
      };
    },
    get elastiCacheConfig() {
      return {
        host: options.elastiCacheHost ?? 'localhost',
        port: options.elastiCachePort ?? 6379,
        slidingExpiration: true,
        ttl: options.elastiCacheTtl ?? 3600,
        useTLS: true,
        clusterMode: false,
        requestTimeoutMs: 15000,
        connectionTimeoutMs: 15000,
      };
    },
    get cognitoUserPoolConfig() {
      const userPoolId = options.cognitoUserPoolId ?? 'ap-northeast-1_testpool';
      const region = options.cognitoUserPoolRegion ?? 'ap-northeast-1';
      const loginProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

      return {
        userPoolId,
        clientId: 'test-client-id',
        region,
        issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
        jwksUrl: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
        loginProvider,
      };
    },
    get cognitoIdentityConfig() {
      const { loginProvider } = this.cognitoUserPoolConfig;

      return {
        identityPoolId: options.cognitoIdentityPoolId ?? 'test-identity-pool',
        providerName: options.cognitoProviderName ?? loginProvider,
        userPoolLoginProvider: loginProvider,
        tokenDurationSeconds: options.tokenDurationSeconds ?? 3600,
      };
    },
  } as AppConfig;
}
