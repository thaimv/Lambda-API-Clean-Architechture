import { injectable } from 'inversify';

import { APP_CONST } from '@/common/constants/app.const';
import type { TDatabaseConfig } from '@/common/types/app.type';
import { getEnv } from '@/common/utils/env.util';

@injectable()
export class AppConfig {
  get nodeEnv() {
    // Get the value of NODE_ENV environment variable, if it's not set, use 'local' as default
    return getEnv('NODE_ENV', APP_CONST.ENVIRONMENTS.LOCAL);
  }

  get isProduction() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.PROD;
  }

  get isDevelopment() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.DEV;
  }

  get isLocal() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.LOCAL;
  }

  get isTest() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.TEST;
  }

  get dbConfig(): TDatabaseConfig {
    const dbUrl = getEnv('DATABASE_URL', '');
    const dbUrlReplica = getEnv('DATABASE_URL_REPLICA', dbUrl);
    const maxRetries = Number(getEnv('DATABASE_MAX_RETRIES', '3'));
    const backOffMs = Number(getEnv('RETRY_PRISMA_CLIENT_TIMEOUT_MS', '1000'));
    const connectionLimit = Number(getEnv('DATABASE_CONNECTION_LIMIT', '3'));

    const proxyEndpoint = getEnv('RDS_PROXY_ENDPOINT');
    const proxyEndpointReplica = getEnv('RDS_PROXY_ENDPOINT_REPLICA', proxyEndpoint);

    return {
      dbUrl,
      dbUrlReplica,
      proxyEndpoint,
      proxyEndpointReplica,
      maxRetries,
      backOffMs,
      connectionLimit,
    };
  }

  get awsConfig() {
    return {
      region: process.env.AWS_REGION ?? getEnv('REGION'),
    };
  }

  get cognitoIdentityConfig() {
    return {
      identityPoolId: getEnv('COGNITO_IDENTITY_POOL_ID'),
      providerName: getEnv('COGNITO_PROVIDER_NAME'),
      tokenDurationSeconds: Number(getEnv('TOKEN_DURATION_SECONDS')),
    };
  }

  get secretManagerKeys() {
    return {
      RDS_SECRET_ARN: getEnv('RDS_SECRET_ARN'),
      GCS_SECRET_NAME: getEnv('GCS_SECRET_NAME', ''),
    };
  }

  get dynamoDBConfig() {
    return {
      endpoint: getEnv('DYNAMODB_ENDPOINT'),
    };
  }

  get lambdaConfig() {
    return {
      retryCount: getEnv('INSERT_RETRY_COUNT'),
      graphqlApiArn: getEnv('LAMBDA_GRAPHQL_API_ARN'),
    };
  }

  get s3BucketConfig() {
    return {
      get s3CommonBucket() {
        return getEnv('S3_COMMON_BUCKET');
      },
    };
  }

  get cloudFront() {
    return {
      get url() {
        return getEnv('CLOUD_FRONT_URL');
      },
      get commonDir() {
        return getEnv('CLOUD_FRONT_COMMON_DIR');
      },
    };
  }

  get elastiCacheConfig() {
    let slidingExpiration: boolean = false;

    const portEnv = getEnv('ELASTICACHE_PORT');
    const port = Number(portEnv);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error('ELASTICACHE_PORT environment variable is invalid');
    }

    // Optional. If the environment variable is not set or set to 'true', enable sliding expiration
    const slidingExpirationEnv = getEnv('ELASTICACHE_SLIDING_EXPIRATION', 'true');
    if (slidingExpirationEnv.toLowerCase() === 'true') {
      slidingExpiration = true;
    }

    // Optional. fallback to default ttl if not set
    const ttlEnv = getEnv('ELASTICACHE_TTL', '86400'); // Default to 1 day

    const ttl = Number(ttlEnv);
    if (isNaN(ttl) || ttl <= 0) {
      throw new Error('ELASTICACHE_TTL environment variable is invalid');
    }

    return {
      host: getEnv('ELASTICACHE_HOST'),
      port,
      slidingExpiration,
      ttl,
    };
  }
}
