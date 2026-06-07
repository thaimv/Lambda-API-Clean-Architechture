# Project Overview

> AI reads this file first to understand the project before performing any task.

## What is this system

**LambdaAPI** is a **base/template backend** for building AWS Lambda APIs with Clean Architecture.
It is not a full product — it ships the infrastructure scaffolding plus **one example domain
module (`users`)** so new modules can be added by copying the same pattern.

What the skeleton provides out of the box:

- Three Lambda entry points (two REST, one AppSync/GraphQL) wired through a custom router.
- A NestJS-style `@Module` decorator + an InversifyJS container as the composition root.
- A `src/common/` shared library: datasources (Prisma, DynamoDB, S3, SQS, SNS, Cognito, etc.),
  decorators, pipes, errors, response helpers, and utils.
- An example `user` module demonstrating the controller → use case → repository → datasource flow
  for both REST and GraphQL.

## Users

Developers building on top of this template. There is no end-user product domain yet — the
`users` module is illustrative (stores a user nickname keyed by `cognitoSub`).

## Platform & Deployment

- **Runtime**: Node.js 22, TypeScript
- **Infrastructure**: AWS Lambda + API Gateway (REST) and AWS AppSync (GraphQL)
- **Relational DB**: Aurora PostgreSQL via Prisma (`prisma/schema.prisma`)
- **NoSQL**: DynamoDB datasource is available in `src/common/datasources/` but not used by any current module
- **Bundling**: esbuild via `deploy/scripts/bundle.js` (one bundle per Lambda)
- **Package manager**: npm

## Lambda Stacks

Each Lambda entry point bootstraps one composition module and one router:

| Lambda      | Entry                                  | Composition module              | Router          | API style          |
| ----------- | -------------------------------------- | ------------------------------- | --------------- | ------------------ |
| public-api  | `src/presenter/lambdas/public-api.ts`  | `modules/public-api.module.ts`  | `RestApiRouter` | REST (API Gateway) |
| auth-api    | `src/presenter/lambdas/auth-api.ts`    | `modules/auth-api.module.ts`    | `RestApiRouter` | REST (API Gateway) |
| appsync-api | `src/presenter/lambdas/appsync-api.ts` | `modules/appsync-api.module.ts` | `GraphQLRouter` | GraphQL (AppSync)  |

## Main API Flows

**REST — get identity token** (`auth-api`):

1. `RestApiRouter.invoke` matches `POST /auth/credential`.
2. Routes to `AuthRestController.postCredential`; extracts token from cookie/header via `getAccessTokenFromRequest`, validates JWT structure manually with `GetIdentityTokenRequestSchema.safeParse`.
3. `GetIdentityTokenUseCase` → `CognitoIdentityRepo` calls Cognito Identity `GetId` / `GetCredentialsForIdentity`.

**REST — `GET` current user** (`public-api`):

1. `RestApiRouter.invoke` matches the path, extracts `cognitoSub` (userId) + username from the Cognito identity, enforces auth.
2. Routes to `UserRestController.getCurrentUser`, which returns the identity context.

**GraphQL — create user info** (`appsync-api`):

1. `GraphQLRouter.invoke` routes the resolver to `UserGraphController.create`.
2. `@ValidationArgs(createUserInfoDtoSchema)` validates the Zod schema at the boundary.
3. `UserUseCase.saveUser` orchestrates → `UserRepo.saveUser` upserts via Prisma → mapped to `UserInfoResponse`.

## Glossary

| Term               | Meaning                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Presenter          | Lambda handler in `src/presenter/lambdas/` — parses request, formats response                                 |
| Composition module | `src/modules/*.module.ts` (e.g. `public-api.module.ts`) — wires datasource DI + domain modules for one Lambda |
| Controller         | Class in a module that maps a route/resolver to a use case (decorators + validation, no business logic)       |
| UseCase            | Business logic layer — orchestrates repositories                                                              |
| Repository         | Data access abstraction (interface in `repos/`, impl in `repos/implements/`)                                  |
| DataSource         | Concrete client (Prisma, DynamoDB, S3, ...) in `src/common/datasources/`                                      |
| `@Module`          | Custom decorator declaring `imports` / `providers` / `controllers` for DI bootstrap                           |
| DI token           | `Symbol.for(...)` defined in `common/constants/di.const.ts` or `{module}.const.ts`                            |

## Key Business Rules

- User identity (`cognitoSub` as `userId`, plus `username`) is extracted by the router from the API Gateway Cognito context.
- Input is validated at the boundary (Zod) — inner layers trust validated data.
- The `users` table (`@@map("users")`) is keyed by `cognitoSub`; `saveUser` performs an upsert via `where: { cognitoSub: authUser.userId }`.
