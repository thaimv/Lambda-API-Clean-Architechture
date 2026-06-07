# UserModule

> Loaded when reviewing or developing code that touches this module.
> This is the **reference/example module** — copy its structure when adding a new domain module.

## Overview

- **Tier**: feature (example)
- **Purpose**: Create/upsert user info and read the current authenticated user. Demonstrates the
  full Clean Architecture flow for both REST and GraphQL.
- **Dependencies**: `src/common` (datasources, decorators, types, models), Prisma/Aurora, InversifyJS, Zod.

## Folder Structure

```
src/modules/user/
├── user.const.ts                 # DI tokens (Symbol.for) for this module
├── user.rest.module.ts           # @Module for the REST controller
├── user.graph.module.ts          # @Module for the GraphQL controller
├── controllers/
│   ├── user.rest.controller.ts   # @Get route → getCurrentUser
│   └── user.graph.controller.ts  # @Route resolver → create (with @ValidationArgs)
├── usecases/
│   ├── user.uc.ts                # IUserUseCase interface
│   └── implement/
│       └── user.uc.impl.ts       # UserUseCase
├── repos/
│   ├── user.repo.ts              # IUserRepo interface
│   └── implements/
│       └── user.repo.impl.ts     # UserRepo (Prisma upsert)
└── dtos/
    ├── requests/create-user-info.request.dto.ts   # Zod schema + inferred type
    └── responses/create-user-info.response.dto.ts
```

> Note: folders are `repos/` and `usecases/implement/`. Unit tests live **outside** the module,
> under `tests/unit-test/modules/user/` (mirroring `src/`).

## DI Wiring

- Tokens are `Symbol.for(...)` in `user.const.ts`: `USER_DI_CONST.IUserRepo`, `USER_DI_CONST.IUserUseCase`.
- `user.rest.module.ts` / `user.graph.module.ts` declare `controllers` + `providers` ({ provide, useClass }).
- The repo injects the shared Prisma client via `DI.DB_CLIENT_DATASOURCE` from `common/constants/di.const.ts`.
- Composition: `src/modules/public-api.module.ts` imports `UserRestModule`; `src/modules/appsync-api.module.ts` imports `UserGraphModule`.

## Cross-Module Interfaces

**Consumes**: `TAuthUser` from `@/common/types/app.type`, `User` model from `@/common/models/user.model`, shared `PrismaDBClientDatasource` datasource.

**Multi-inject**: `UserUseCase` injects both `DI.COMMON_USER_REPO` (`ICommonUserRepo` alias) and `USER_DI_CONST.IUserRepo` (module write repo).

**Exposes**: `IUserUseCase`, `IUserRepo` (within the module; not consumed by other modules).

## Business Rules

- User identity (`userId` = `cognitoSub`, `username`) is extracted by the router from the Cognito auth provider.
- GraphQL input validated at the controller boundary via `createUserInfoDtoSchema` (`@ValidationArgs`).
- `saveUser` performs a Prisma **upsert** keyed by `cognitoSub` (`where: { cognitoSub: authUser.userId }`), stamping create/update author + datetime.

## Known Patterns / Notes

- Thin controller pattern (no business logic in controllers).
- Separate REST vs GraphQL controllers + modules sharing the same use case + repo.
- Aurora-backed repository via the shared Prisma `PrismaDBClientDatasource` datasource.
