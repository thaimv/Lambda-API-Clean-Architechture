# UsersModule

> Loaded when reviewing or developing code that touches this module.
> This is the **reference/example module** — copy its structure when adding a new domain module.

## Overview

- **Tier**: feature (example)
- **Purpose**: Create/upsert user info and read the current authenticated user. Demonstrates the
  full Clean Architecture flow for both REST and GraphQL.
- **Dependencies**: `src/common` (datasources, decorators, types, models), Prisma/Aurora, InversifyJS, Zod.

## Folder Structure

```
src/modules/users/
├── users.const.ts                 # DI tokens (Symbol.for) for this module
├── users.rest.module.ts           # @Module for the REST controller
├── users.graph.module.ts          # @Module for the GraphQL controller
├── controllers/
│   ├── users.rest.controller.ts   # @Get route → getCurrentUser
│   └── users.graph.controller.ts  # @Route resolver → create (with @ValidationArgs)
├── usecases/
│   ├── users.uc.ts                # IUsersUseCase interface
│   └── implement/
│       └── users.uc.impl.ts       # UsersUseCase
├── repos/
│   ├── users.repo.ts              # IUsersRepo interface
│   └── implements/
│       └── users.repo.impl.ts     # UsersRepo (Prisma upsert)
└── dtos/
    ├── requests/create-user-info.request.dto.ts   # Zod schema + inferred type
    └── responses/create-user-info.response.dto.ts
```

> Note: folders are `repos/` and `usecases/implement/`. Unit tests live **outside** the module,
> under `tests/unit-test/modules/users/` (mirroring `src/`).

## DI Wiring

- Tokens are `Symbol.for(...)` in `users.const.ts`: `USERS_DI_CONST.IUsersRepo`, `USERS_DI_CONST.IUsersUseCase`.
- `users.rest.module.ts` / `users.graph.module.ts` declare `controllers` + `providers` ({ provide, useClass }).
- The repo injects the shared Prisma client via `DI.DB_CLIENT_DATASOURCE` from `common/constants/di.const.ts`.
- Composition: `src/modules/public-rest-api.module.ts` imports `UsersRestModule`; `src/modules/appsync-api.module.ts` imports `UsersGraphModule`.

## Cross-Module Interfaces

**Consumes**: `TAuthUser` from `@/common/types/app.type`, `User` model from `@/common/models/user.model`, shared `DBClient` datasource.

**Multi-inject**: none.

**Exposes**: `IUsersUseCase`, `IUsersRepo` (within the module; not consumed by other modules).

## Business Rules

- User identity (`userId` = Gigya UUID, `username`, `cognitoIdentityId`) is extracted by the router from the Cognito auth provider.
- Input validated at the controller boundary via `createUserInfoDtoSchema` (`@ValidationArgs`).
- `saveUser` performs a Prisma **upsert** keyed by `gigyaUuid`, stamping create/update author + datetime.

## Known Patterns / Notes

- Thin controller pattern (no business logic in controllers).
- Separate REST vs GraphQL controllers + modules sharing the same use case + repo.
- Aurora-backed repository via the shared Prisma `DBClient` datasource.
