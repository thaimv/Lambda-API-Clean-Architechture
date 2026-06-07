import { config } from 'dotenv';

config({ path: './envs/.env.e2e' });

// AWS credentials for CloudWatch Logs Live Tail (needs logs:StartLiveTail).
// Leave blank to rely on ambient credentials (SSO / instance profile / env).
export const awsConfig = {
  region: process.env.AWS_REGION ?? 'eu-west-2',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
};

// GraphQL endpoint — credentials are obtained at runtime via Cognito login
export const graphqlConfig = {
  endpoint: process.env.GRAPHQL_ENDPOINT ?? '',
};

// REST API Gateway base URLs — used for public-api and auth-api endpoints
export const restApiConfig = {
  publicApi: process.env.PUBLIC_API_BASE_URL ?? '',
  authApi: process.env.AUTH_API_BASE_URL ?? '',
  /** API Gateway usage plan key — required for public-api (IAM + x-api-key). */
  publicApiKey: process.env.PUBLIC_API_KEY ?? '',
  authApiKey: process.env.AUTH_API_KEY ?? '',
};

// Cognito User Pool + Identity Pool — used to exchange idToken for AWS credentials
export const cognitoConfig = {
  region: process.env.AWS_REGION ?? 'eu-west-2',
  userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
  clientId: process.env.COGNITO_CLIENT_ID ?? '',
  identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID ?? '',
};

// Test user credentials — used to login and obtain a real session
export const testUserConfig = {
  username: process.env.TEST_USER_USERNAME ?? '',
  password: process.env.TEST_USER_PASSWORD ?? '',
};

export const cloudwatchConfig = {
  logFlushWait: Number(process.env.CLOUDWATCH_LOG_FLUSH_WAIT) || 20,
  logGroupArns: {
    appsyncLambda: process.env.APPSYNC_LAMBDA_LOG_GROUP_ARN ?? '',
    publicApiLambda: process.env.PUBLIC_API_LAMBDA_LOG_GROUP_ARN ?? '',
  },
};

/**
 * Vitest hook timeouts for E2E suites.
 * afterAll must exceed `logFlushWait` (seconds) — terminate() sleeps that long before log assertions.
 */
export const e2eHookTimeouts = {
  beforeAll: 60_000,
  afterAll: Math.max(60_000, (cloudwatchConfig.logFlushWait + 10) * 1000),
} as const;
