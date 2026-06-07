# Architecture Rules

> Loaded when reviewing, writing, or analyzing code that touches module structure, layers, or DI.

## Architecture Style

**Clean Architecture** — strict dependency rule: outer layers depend on inner layers, never the reverse.

```
Presenter (Lambda Handler) + Controller
    ↓ depends on
UseCase (Business Logic)
    ↓ depends on
Repository (Data Access — interface only)
    ↑ depends on
DataSource (Prisma / DynamoDB / S3 / HTTP)  ← lives in src/common/datasources/
```

## Layer Responsibilities

| Layer          | Location                            | Contains                                                                                            | May Import                                             | Must NOT Import                                          |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Presenter      | `src/presenter/lambdas/`            | Lambda handlers, bootstrap, router invocation                                                       | composition module, router, DI bootstrap               | module business logic                                    |
| Controller     | `src/modules/{module}/controllers/` | Maps route/resolver → use case, validation decorators                                               | UseCase interfaces                                     | repositories / datasources directly                      |
| UseCase        | `src/modules/{module}/usecases/`    | Business logic, orchestration                                                                       | Repository interfaces                                  | Data layer directly                                      |
| Repository     | `src/modules/{module}/repos/`       | Data access abstraction (interface + `implements/`)                                                 | DataSource interfaces/clients                          | UseCase or Presenter                                     |
| DataSource     | `src/common/datasources/{name}/`    | DB / SDK clients (Prisma, DynamoDB, S3, SQS, SNS, Cognito, ...)                                     | Prisma, AWS SDK                                        | UseCase or Controller or Presenter                       |
| Common         | `src/common/`                       | cross-cutting shared code (datasources, decorators, pipes, errors, responses, models, types, utils) | runtime libs                                           | module business logic                                    |
| Infrastructure | `src/config/`                       | DI bootstrap, datasource DI modules, route wiring, app config                                       | `common/*`, module interfaces/contracts, external SDKs | presenter business logic, cross-module business coupling |

## Common Layer Architecture

`src/common/` is a shared internal library for the whole codebase. Keep it generic and domain-agnostic.

### Common Folder Intent

- `datasources/`: concrete adapters to Aurora (Prisma), DynamoDB, S3, SQS, SNS, Cognito, Lambda, Secrets Manager, cache, etc. Each has an interface + `implements/`.
- `constants/`: global constants (including `di.const.ts` DI tokens, route/response constants).
- `decorators/`: framework-style decorators (`@Module`, route decorators, `@ValidationArgs`).
- `lambda/`: Lambda runtime primitives — `Lambda`, `Pipeline`, and `pipes/` (logging, error handling).
- `errors/`: shared error classes mapped by pipes/presenters.
- `logger/`: shared logging contracts/helpers.
- `models/`, `types/`: shared types/models used across module boundaries.
- `responses/`: standardized API response helpers.
- `utils/`: pure utility helpers with no infrastructure side effects.

### Common Rules

1. Common code must not embed module-specific business rules.
2. Datasources are the **only** place that instantiates Prisma/DynamoDB/S3/SDK clients. Use cases never touch SDKs.
3. Prefer pure functions and side-effect-free helpers in `common/utils`.
4. Shared errors and response models should be defined once in `common` and reused by pipes/use cases.
5. Datasources expose an interface; modules consume the interface via a DI token, never the concrete class.

## Infrastructure Architecture (`src/config/`)

Infrastructure in this project is `src/config/` (composition) + `src/common/datasources/` (adapters).
There is **no** `src/data/` folder.

### `src/config/`

- `di/di.config.ts`: composition root — the InversifyJS `container`, `bootstrapApplication(entryModule, router)`, and `getInstance`.
- `di/datasources/*.di.ts`: one `@Module` per datasource group (database, dynamodb, cache, object-storage, lambda, api-gateway, push-notification, ...). Imported by the composition modules.
- `routes/`: `rest-api-router.ts` (`RestApiRouter`), `graph-ql-router.ts` (`GraphQLRouter`), `router.interface.ts`.
- `app.config.ts`: environment and app configuration assembly (bound via `DI.APP_CONFIG`).

### Composition Modules (`src/modules/`)

- `public-rest-api.module.ts` and `appsync-api.module.ts` are `@Module`s that `imports` the datasource DI modules + the relevant domain module (`UsersRestModule` / `UsersGraphModule`).
- The Lambda entry point calls `bootstrapApplication(<CompositionModule>, router)` which recursively binds providers/controllers and registers controllers on the router.

### Infrastructure Rules

1. Infrastructure depends on contracts from inner layers, not the reverse.
2. Modules/use cases consume interfaces via DI tokens, never concrete datasource classes.
3. All providers/controllers are registered through `@Module` metadata (`imports` / `providers` / `controllers`).
4. DI tokens are centralized as `Symbol.for(...)`: shared infra tokens in `common/constants/di.const.ts` (`DI`), module tokens in `{module}.const.ts`.
5. Infrastructure/datasources are allowed to use SDK/ORM clients; use cases are not.

### Typical Dependency Flow

1. Lambda entry bootstraps the composition module + router; the router resolves controllers from the container.
2. Controller validates input and calls the UseCase (injected via its module token).
3. UseCase depends on a Repository interface (injected via the module token).
4. Repository uses a DataSource from `src/common/datasources/` (injected via a `DI` token, e.g. `DI.DB_CLIENT_DATASOURCE`).
5. DataSource talks to Prisma/DynamoDB/S3/Lambda/Secrets Manager.

This keeps business logic isolated while still using required infrastructure through explicit contracts and DI.

## Module Structure

Each domain module lives in `src/modules/{module-name}/` and owns:

- `{module}.const.ts` — DI tokens (`Symbol.for`) for the module
- `{module}.rest.module.ts` / `{module}.graph.module.ts` — `@Module` declaring controllers + providers
- `controllers/` — maps route/resolver events to use cases (no business logic)
- `dtos/` — request and response DTOs, Zod schemas under `requests/` and `responses/`
- `repos/` — repository interfaces + implementations under `repos/implements/`
- `usecases/` — use case interfaces + implementations under `usecases/implement/`

Unit tests are **not** inside the module — they live under `tests/unit-test/modules/{module-name}/` mirroring `src/`.

```
src/modules/{module-name}/
├── {module-name}.const.ts             ← DI tokens (Symbol.for)
├── {module-name}.rest.module.ts       ← @Module (REST controller)
├── {module-name}.graph.module.ts      ← @Module (GraphQL controller)
├── controllers/
│   ├── {entity}.rest.controller.ts
│   └── {entity}.graph.controller.ts
├── dtos/
│   ├── requests/
│   │   └── {feature}.request.dto.ts
│   └── responses/
│       └── {feature}.response.dto.ts
├── repos/
│   ├── {entity}.repo.ts               ← interface
│   └── implements/
│       └── {entity}.repo.impl.ts
└── usecases/
    ├── {feature}.uc.ts                ← interface
    └── implement/
        └── {feature}.uc.impl.ts
```

## Module Isolation Rules

1. **No cross-module imports** — modules in `src/modules/` must NOT import from each other directly.
2. **Share via `src/common/`** — shared utilities, base classes, error types, response helpers.
3. **Share via interfaces** — if a module needs data from another, define a shared interface/datasource in `src/common/` and inject it via DI.
4. `src/config/` and `src/common/datasources/` are infrastructure: modules may depend on interfaces/tokens exposed for DI, but not on concrete infra implementations.

## DI with InversifyJS (`@Module` decorator)

DI is wired with a NestJS-style `@Module` decorator (`common/decorators/module.decorator`). The
InversifyJS `container` and `bootstrapApplication` live in `src/config/di/di.config.ts`.
`bootstrapApplication(entryModule, router)` recursively reads each module's metadata, binds
`providers`, and registers `controllers` on the router.

### Tokens

DI tokens are `Symbol.for(...)`:

- Shared infrastructure tokens → `common/constants/di.const.ts` (the `DI` object, e.g. `DI.DB_CLIENT_DATASOURCE`, `DI.APP_CONFIG`).
- Module-specific tokens → `{module}.const.ts` (e.g. `USERS_DI_CONST.IUsersUseCase`).

### Module / Provider Pattern

```typescript
@Module({
  controllers: [UsersGraphController],
  providers: [
    { provide: USERS_DI_CONST.IUsersRepo, useClass: UsersRepo },
    { provide: USERS_DI_CONST.IUsersUseCase, useClass: UsersUseCase },
  ],
})
export class UsersGraphModule {}
```

Providers also support `useValue` and `useFactory`. A bare class entry binds the class to itself.

### Injection Pattern

```typescript
@injectable()
export class UsersUseCase implements IUsersUseCase {
  constructor(@inject(USERS_DI_CONST.IUsersRepo) private readonly usersRepo: IUsersRepo) {}
}
```

### Rules

- Every class in the dependency graph must be decorated with `@injectable()`.
- Import `reflect-metadata` at the Lambda entry point (top of file), not in every class.
- Do NOT use property injection; always use constructor injection.

## Lambda Handler Pattern (Presenter)

Lambda handlers are **thin presenters** — they bootstrap the composition module + router and
delegate to it. Parsing/validation happens in the router + controller (`@ValidationArgs`), not in
the handler.

```typescript
// src/presenter/lambdas/public-rest-api.ts
import 'reflect-metadata';
import { Lambda } from '@/common/lambda/lambda';
import { bootstrapApplication } from '@/config/di/di.config';
import { RestApiRouter } from '@/config/routes/rest-api-router';
import { PublicRestApiModule } from '@/modules/public-rest-api.module';

const router = new RestApiRouter(true);
bootstrapApplication(PublicRestApiModule, router);

export const handler: APIGatewayProxyHandler = new Lambda((event) =>
  router.invoke(event),
).createHandler();
```

**Forbidden in Lambda handlers / controllers**: business logic, DB calls, conditional branching on data values.

## Database Selection Rules

| Data Type                               | Database          | Access                                                       |
| --------------------------------------- | ----------------- | ------------------------------------------------------------ |
| Relational / transactional (e.g. users) | Aurora PostgreSQL | Prisma ORM (`@/common/datasources/database`)                 |
| Event / log / ranking / time-series     | DynamoDB          | `@aws-sdk/lib-dynamodb` (`@/common/datasources/dynamodb`)    |
| Files / binary blobs                    | S3                | `@aws-sdk/client-s3` (`@/common/datasources/object-storage`) |

Do NOT use Prisma for DynamoDB data. Do NOT use DynamoDB for relational queries.
(In this base template only Aurora/Prisma is wired into a module; the rest are scaffolding.)

## Validation Rules

- Validate at the Lambda boundary using **Zod schemas**.
- Define request schemas in `src/modules/{module}/dtos/requests/` (or shared schemas in `src/common/types/` when cross-module).
- Inner layers (UseCase, Repository) receive already-validated, typed data — no re-validation needed.
- Never trust raw `event.body` past the presenter layer.

## Error Handling

- Use custom error classes from `src/common/errors/`.
- UseCase throws domain errors; Lambda handler catches and maps to HTTP responses.
- Repository wraps DB errors into domain errors.
- Never expose raw DB errors or stack traces in HTTP responses.

## Logic Placement Summary

| Logic Type                      | Where                                                      |
| ------------------------------- | ---------------------------------------------------------- |
| Input validation                | Boundary layer: controller decorators + Lambda entry (Zod) |
| Business rules / orchestration  | UseCase                                                    |
| Data access / caching / mapping | Repository + DataSource                                    |
| HTTP response formatting        | Lambda handler                                             |
| Shared utilities (date, crypto) | `src/common/utils/`                                        |
| Error classification            | `src/common/errors/`                                       |
