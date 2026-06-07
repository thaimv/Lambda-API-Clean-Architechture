# Environment files

| File           | Purpose                                       |
| -------------- | --------------------------------------------- |
| `.example.env` | Template — copy to `.env` for local dev / E2E |
| `.env`         | Your local values (do not commit secrets)     |

`env.util.ts` loads **only** `envs/.env`. Unit tests use mocks and do not need this file.

## Variables by use case

| Use case                           | Required vars                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Bootstrap** (both Lambdas)       | `DYNAMODB_USER_NOTIFICATION_TABLE`, `DYNAMODB_USER_NOTIFICATION_TABLE_LSI1`, `DYNAMODB_USER_NOTIFICATION_TABLE_LSI2` |
| **public-rest-api** (`GET /user`)  | Bootstrap vars + `NODE_ENV`, `AWS_REGION`, `DYNAMODB_ENDPOINT` (local)                                               |
| **appsync-api** (`createUserInfo`) | Above + `DATABASE_URL`, `RDS_PROXY_ENDPOINT`, `RDS_SECRET_ARN`                                                       |
| **Prisma migrate**                 | `DATABASE_URL` — run `npm run docker:up` then `npm run migrate:dev`                                                  |

Vars for unused AppConfig sections (S3, OpenWeather, CloudFront, ElastiCache, …) are omitted — add them when wiring a module that needs them.
