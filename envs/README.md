# Environment files

| File                      | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `appsync-api.env.example` | Template for **appsync-api** Lambda (local dev)            |
| `public-api.env.example`  | Template for **public-api** Lambda (local dev)             |
| `.example.env`            | Combined template (both Lambdas) — legacy / shortcut       |
| `.env.e2e.example`        | Template for **E2E tests** (`npm run test:e2e`)            |
| `.env`                    | Local dev values (Lambdas, migrations) — do **not** commit |
| `.env.e2e`                | E2E test values — do **not** commit secrets                |

`env.util.ts` loads **only** `envs/.env` (local dev). E2E tests load `envs/.env.e2e`. Unit tests use mocks and do not need either file.

## Local dev setup

```bash
# appsync-api only
cp envs/appsync-api.env.example envs/.env

# public-api only
cp envs/public-api.env.example envs/.env

# Both — merge vars from both *.env.example into envs/.env
```

## E2E test setup

```bash
cp envs/.env.e2e.example envs/.env.e2e
# Fill in COGNITO_*, TEST_USER_*, and ARNs, then:
npm run test:e2e
```

## Variables by purpose

| Variable group                                                                                                    | Template file             | Used by            |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------ |
| `DATABASE_URL`, `RDS_*`                                                                                           | `appsync-api.env.example` | appsync-api Lambda |
| `DYNAMODB_*`                                                                                                      | `public-api.env.example`  | public-api Lambda  |
| `COGNITO_*`, `TEST_USER_*`, `GRAPHQL_ENDPOINT`, `APPSYNC_LAMBDA_LOG_GROUP_ARN`, `PUBLIC_API_LAMBDA_LOG_GROUP_ARN` | `.env.e2e.example`        | E2E tests          |

## IAM permissions required for E2E

```json
{
  "Effect": "Allow",
  "Action": ["logs:StartLiveTail"],
  "Resource": "*"
}
```

> Temporary AppSync credentials are obtained at runtime via Cognito — no `GRAPHQL_AWS_*` keys needed.
