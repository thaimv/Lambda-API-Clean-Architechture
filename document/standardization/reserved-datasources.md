# Reserved Datasource Modules

These DI modules and datasource implementations are **shared infrastructure** kept for reuse across future feature modules. They are fully unit-tested but **not all are wired** into current Lambda composition modules.

## Currently wired (transitive)

Wired through domain modules — not imported directly in `AppsyncApiModule` / `PublicRestApiModule`:

| Module                             | Token / role              | Wired via                                 |
| ---------------------------------- | ------------------------- | ----------------------------------------- |
| `database.di`                      | `DI.DB_CLIENT_DATASOURCE` | Transitive via `CommonUserRepo`           |
| `secrets-manager.di`               | Secrets for RDS           | Transitive via `database.di`              |
| `repos/user.di` (`CommonUserRepo`) | `DI.COMMON_USER_REPO`     | `AppsyncApiModule`, `PublicRestApiModule` |

## Composition modules (direct imports)

| Module                      | Imports                                           |
| --------------------------- | ------------------------------------------------- |
| `appsync-api.module.ts`     | `CommonUserRepo`, `UsersGraphModule`, `AppConfig` |
| `public-rest-api.module.ts` | `CommonUserRepo`, `UsersRestModule`, `AppConfig`  |

## Reserved (not wired yet)

| Module                  | Capability                |
| ----------------------- | ------------------------- |
| `dynamodb.di`           | DynamoDB                  |
| `object-storage.di`     | S3                        |
| `lambda.di`             | Lambda invoke             |
| `api-gateway.di`        | API Gateway               |
| `push-notification.di`  | SNS push                  |
| `cache.di`              | ElastiCache / ValKey      |
| `athena.di`             | AWS Athena queries        |
| `cloudwatch-metrics.di` | CloudWatch custom metrics |
| `cognito-identity.di`   | Cognito Identity Pool     |
| `email.di`              | AWS SES email             |
| `graphql.di`            | Lambda GraphQL invoke     |
| `message-queue.di`      | AWS SQS                   |
| `parquet-file.di`       | Parquet read/write        |
| `step-function.di`      | AWS Step Functions        |
| `translate.di`          | AWS Translate             |

To activate a reserved datasource, import its `*DatasourceModule` in the relevant domain module or composition module when a feature needs it.

Do **not** delete reserved modules without confirming no planned features depend on them.
