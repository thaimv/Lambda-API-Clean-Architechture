# LambdaAPIs

TypeScript monorepo — **base/template backend** for AWS Lambda APIs with Clean Architecture. Ships infrastructure scaffolding plus an example **`users`** module for both REST and GraphQL.

## Lambda Stacks

| Lambda            | Entry                                      | Router          | API style          |
| ----------------- | ------------------------------------------ | --------------- | ------------------ |
| `public-rest-api` | `src/presenter/lambdas/public-rest-api.ts` | `RestApiRouter` | REST (API Gateway) |
| `appsync-api`     | `src/presenter/lambdas/appsync-api.ts`     | `GraphQLRouter` | GraphQL (AppSync)  |

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
npm run build:public-rest-api
npm run build:appsync-api
```

Output: `build/{api-name}/app.js`

## Test

```bash
npm run test
npm run test:coverage
npm run test:ci           # CI with coverage gate
npm run test:e2e          # needs envs/.env
```

Unit tests use mocks — no env file required.

## Lint & Format

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:ci
```

Pre-commit hooks (husky + lint-staged) run lint and format on staged files.

## Deploy

Azure Pipelines definitions: `deploy/cicd/`.

Manual deploy steps:

1. `npx prisma migrate deploy` _(chỉ khi schema DB đổi)_
2. `sh deploy/scripts/001_prepare-prisma-layer.sh` — `npm ci` (nếu thiếu deps) + `prisma generate` + đóng gói Prisma Lambda layer
3. `npm run build` — zip `build/*/app.js` and upload to AWS Lambda

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

- [REST — Get Current User](document/detail-designs/rest/users/Get%20Current%20User.md)
- [GraphQL — createUserInfo](document/detail-designs/graphql/users/createUserInfo.md)
- [Design template](document/detail-designs/_template.md)

### AI Copilot Kit

VS Code Copilot skills, rules, and project memory live under [`.github/`](.github/agents.md). Key commands:

- `/lambda-init` — validate project context
- `/lambda-rest-design` / `/lambda-rest-impl` — REST API design and implementation
- `/lambda-graphql-design` / `/lambda-graphql-impl` — GraphQL design and implementation
- `/lambda-pr-review` — review a PR

## Adding a New Module

1. Copy `src/modules/users/` as a template under `src/modules/<name>/`.
2. Create REST and/or GraphQL module files (`.rest.module.ts`, `.graph.module.ts`).
3. Register the module in `src/modules/public-rest-api.module.ts` or `src/modules/appsync-api.module.ts`.
4. Write detail design docs under `document/detail-designs/rest/` or `graphql/`.
5. Update `brain/project-context.json` and create `brain/modules/<Name>.md`.
6. Add unit tests under `tests/unit-test/modules/<name>/`.
