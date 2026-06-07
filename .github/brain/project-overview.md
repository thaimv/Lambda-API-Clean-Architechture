# Project Overview

> AI reads this file first to understand the project before performing any task.

## What is this system

**LambdaAPI** is a **base/template backend** for building AWS Lambda APIs with Clean Architecture.
It is not a full product — it ships the infrastructure scaffolding plus **one example domain
module (`users`)** so new modules can be added by copying the same pattern.

What the skeleton provides out of the box:

- Two Lambda entry points (one REST, one AppSync/GraphQL) wired through a custom router.
- A NestJS-style `@Module` decorator + an InversifyJS container as the composition root.
- A `src/common/` shared library: datasources (Prisma, DynamoDB, S3, SQS, SNS, Cognito, etc.),
  decorators, pipes, errors, response helpers, and utils.
- An example `users` module demonstrating the controller → use case → repository → datasource flow
  for both REST and GraphQL.

## Users

Developers building on top of this template. There is no end-user product domain yet — the
`users` module is illustrative (stores a user nickname keyed by Gigya UUID / Cognito identity).

## Platform & Deployment

- **Runtime**: Node.js 22, TypeScript
- **Infrastructure**: AWS Lambda + API Gateway (REST) and AWS AppSync (GraphQL)
- **Relational DB**: Aurora PostgreSQL via Prisma (`prisma/schema.prisma`)
- **NoSQL**: DynamoDB datasource is available in `src/common/datasources/` but not used by any current module
- **Bundling**: esbuild via `deploy/scripts/bundle.js` (one bundle per Lambda)
- **Package manager**: npm

## Lambda Stacks

Each Lambda entry point bootstraps one composition module and one router:

| Lambda          | Entry                                      | Composition module                  | Router          | API style          |
| --------------- | ------------------------------------------ | ----------------------------------- | --------------- | ------------------ |
| public-rest-api | `src/presenter/lambdas/public-rest-api.ts` | `modules/public-rest-api.module.ts` | `RestApiRouter` | REST (API Gateway) |
| appsync-api     | `src/presenter/lambdas/appsync-api.ts`     | `modules/appsync-api.module.ts`     | `GraphQLRouter` | GraphQL (AppSync)  |

## Main API Flows

**REST — `GET` current user** (`public-rest-api`):

1. `RestApiRouter.invoke` matches the path, extracts Gigya UUID + username from the Cognito identity, enforces auth.
2. Routes to `UsersRestController.getCurrentUser`, which returns the identity context.

**GraphQL — create user info** (`appsync-api`):

1. `GraphQLRouter.invoke` routes the resolver to `UsersGraphController.create`.
2. `@ValidationArgs(createUserInfoDtoSchema)` validates the Zod schema at the boundary.
3. `UsersUseCase.saveUser` orchestrates → `UsersRepo.saveUser` upserts via Prisma → mapped to `UserInfoResponse`.

## Glossary

| Term               | Meaning                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Presenter          | Lambda handler in `src/presenter/lambdas/` — parses request, formats response                                      |
| Composition module | `src/modules/*.module.ts` (e.g. `public-rest-api.module.ts`) — wires datasource DI + domain modules for one Lambda |
| Controller         | Class in a module that maps a route/resolver to a use case (decorators + validation, no business logic)            |
| UseCase            | Business logic layer — orchestrates repositories                                                                   |
| Repository         | Data access abstraction (interface in `repos/`, impl in `repos/implements/`)                                       |
| DataSource         | Concrete client (Prisma, DynamoDB, S3, ...) in `src/common/datasources/`                                           |
| `@Module`          | Custom decorator declaring `imports` / `providers` / `controllers` for DI bootstrap                                |
| DI token           | `Symbol.for(...)` defined in `common/constants/di.const.ts` or `{module}.const.ts`                                 |

## Key Business Rules

- User identity (Gigya UUID + username) is extracted by the router from the API Gateway Cognito context.
- Input is validated at the boundary (Zod) — inner layers trust validated data.
- The `users` table is keyed by `gigyaUuid`; `saveUser` performs an upsert.
