# LambdaAPIs

TypeScript monorepo — **base/template backend** for AWS Lambda APIs with Clean Architecture. Ships infrastructure scaffolding plus an example **`user`** module for both REST and GraphQL.

## Lambda Stacks

| Lambda        | Entry                                  | Router          | API style          |
| ------------- | -------------------------------------- | --------------- | ------------------ |
| `public-api`  | `src/presenter/lambdas/public-api.ts`  | `RestApiRouter` | REST (API Gateway) |
| `appsync-api` | `src/presenter/lambdas/appsync-api.ts` | `GraphQLRouter` | GraphQL (AppSync)  |

### Example endpoints

| Style   | Endpoint / Resolver | Description                          |
| ------- | ------------------- | ------------------------------------ |
| REST    | `GET /user`         | Return current user identity context |
| GraphQL | `createUserInfo`    | Upsert user nickname by Gigya UUID   |

Request flow:

```
API Gateway / AppSync → Router → Controller → UseCase → Repository → DataSource
```

## Prerequisites

- Node.js 22+
- Docker — local Postgres 18 (`docker/`) and DynamoDB Local

## Run locally (simulator)

Architecture and folder layout: [project structure](document/standardization/project-structure.md). Env vars: [envs/README.md](envs/README.md).

```bash
# 1. Local DB (Postgres 18 :5433, DynamoDB :8000)
npm run docker:up

# 2. Root
npm install
cp envs/.example.env envs/.env
npm run generate
npm run migrate:dev

# 3. Simulator — serverless deps (first time)
cd out/simulator && npm install && cd ../..

# 4. Configure out/simulator/env.yml (local: block), then start
sh ./out/simulator/run_script.sh
```

Stop DB: `npm run docker:down`

`run_script.sh` builds both handlers and starts serverless-offline.

REST: `http://localhost:3000` · GraphQL: `http://localhost:20002/graphql`

## Build

Build both Lambda handlers:

```bash
npm run build
# or individually:
npm run build:public-api
npm run build:appsync-api
```

Output: `build/{api-name}/app.js`

## Test

```bash
npm run test
npm run test:coverage
npm run test:ci           # CI with coverage gate

# E2E (needs envs/.env.e2e — copy from envs/.env.e2e.example and fill in values)
npm run test:e2e
```

Unit tests use mocks — no env file, DB, or AWS required.

E2E tests invoke the **deployed** Lambda via AppSync / API Gateway. See [`tests/e2e/`](tests/e2e/) for helpers and [`envs/.env.e2e.example`](envs/.env.e2e.example) for required env vars.

## Lint & Format

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:ci
```

Pre-commit hooks (husky + lint-staged) run lint and format on staged files.

## Deploy

GitHub Actions CD: `.github/workflows/` (orchestrated by `cd.yml`).

Manual deploy steps:

1. `npx prisma migrate deploy` _(only when the DB schema changes)_
2. `bash deploy/scripts/001_prepare-prisma-layer.sh` — `prisma generate` + `layers/prisma/prisma-layer.zip`
3. Publish layer + attach to both Lambdas (`aws lambda publish-layer-version`, `update-function-configuration`)
4. `npm run build` — zip `build/*/app.js` and upload to AWS Lambda

GitHub CD republishes the Prisma layer when its **fingerprint** differs from the latest published layer on AWS. Fingerprint is derived from `prisma/schema.prisma` (`Data model version`, `binaryTargets`) and `@prisma/client` in `package-lock.json`. Bump `/// Data model version : vX.Y.Z` when the schema changes (keep in sync with `app/lambda/layer/prisma/schema.prisma`). DB migrations are deployed separately via `migrate:deploy` and do not affect the layer fingerprint. Set `PRISMA_LAYER_NAME` on each GitHub Environment (`api-develop`, `api-staging`).

## CI/CD

| Workflow | File                           | Trigger                     | Purpose                  |
| -------- | ------------------------------ | --------------------------- | ------------------------ |
| CI       | `.github/workflows/ci.yml`     | Every push + pull request   | Lint, format, unit tests |
| CD       | `.github/workflows/cd.yml`     | Push to `develop`/`staging` | Build and deploy         |
| Review   | `.github/workflows/review.yml` | PR to `develop`             | AI PR review             |

## Documentation

### Standardization

- [Project structure](document/standardization/project-structure.md)
- [Coding conventions](document/standardization/project-coding-conventions.md)
- [Reserved datasources](document/standardization/reserved-datasources.md)
- [Using libraries](document/standardization/using-libraries.md)
- [Error handling](document/standardization/error-handling.md)
- [Logging](document/standardization/logging.md)

### Detail Designs

- [REST — Get Current User](document/detail-designs/rest/user/Get%20Current%20User.md)
- [GraphQL — createUserInfo](document/detail-designs/graphql/user/createUserInfo.md)
- [Design template](document/detail-designs/_template.md)

### AI Copilot Kit

Skills, rules, and project memory live under [`.github/`](.github/agents.md). Available commands:

| Command                          | Purpose                                          |
| -------------------------------- | ------------------------------------------------ |
| `/lambda-init`                   | Validate project context before starting work    |
| `/lambda-rest-design`            | Write REST API detail design doc                 |
| `/lambda-rest-impl`              | Implement a REST Lambda end-to-end               |
| `/lambda-graphql-design`         | Write GraphQL detail design doc                  |
| `/lambda-graphql-impl`           | Implement a GraphQL Lambda end-to-end            |
| `/lambda-generate-unit-tests`    | Generate unit tests for a module                 |
| `/lambda-generate-api-tests`     | Generate E2E tests for a GraphQL/REST API        |
| `/lambda-generate-feature-tests` | Generate E2E tests for a multi-step feature flow |
| `/lambda-spec-review`            | Review a detail design doc                       |
| `/lambda-pr-review`              | Review a pull request                            |

## Adding a New Module

1. Copy `src/modules/user/` as a template under `src/modules/<name>/`.
2. Create REST and/or GraphQL module files (`.rest.module.ts`, `.graph.module.ts`).
3. Register the module in `src/modules/public-api.module.ts` or `src/modules/appsync-api.module.ts`.
4. Write detail design docs under `document/detail-designs/rest/` or `graphql/`.
5. Update `brain/project-context.json` and create `brain/modules/<Name>.md`.
6. Add unit tests under `tests/unit-test/modules/<name>/`.
