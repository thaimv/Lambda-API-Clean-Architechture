# Project Structure

Clean Architecture monorepo with three Lambda entry points: **Public REST API**, **Auth API**, and **AppSync GraphQL API**.

---

## Directory Overview

Layout relative to the **repository root** (the folder that contains `package.json`, `src/`, and `.github/` — clone path/name may differ per machine):

```
.
├── deploy/
│   └── scripts/
│       ├── 001_prepare-prisma-layer.sh
│       ├── 002_build-lambdas-from-config.sh
│       ├── 003_build-lambda-artifact.sh
│       └── bundle.js          # esbuild: npm run build:<api-name>
├── docker/                    # Local Postgres + DynamoDB (docker compose)
├── document/                  # API docs + standardization guides
├── envs/
│   ├── .env                   # Local development
│   └── .example.env           # Template
├── prisma/
│   └── schema.prisma
├── src/
│   ├── common/                # Shared infrastructure & framework
│   ├── config/                # AppConfig, DI, routers
│   ├── modules/               # Composition + feature modules
│   │   ├── public-api.module.ts
│   │   ├── appsync-api.module.ts
│   │   └── user/             # Example domain module
│   └── presenter/             # Lambda handlers + GraphQL schema
├── tests/
│   ├── common/helpers/
│   └── unit-test/             # Mirrors src/ layout
```

---

## I. Lambda Entry Points (`src/presenter/lambdas/`)

| File             | Handler          | Module             |
| ---------------- | ---------------- | ------------------ |
| `public-api.ts`  | API Gateway REST | `PublicApiModule`  |
| `appsync-api.ts` | AppSync GraphQL  | `AppsyncApiModule` |

Both bootstrap DI at module load and export `handler`. Error handling and logging run through **Pipeline pipes** — not inline `try/catch` in handlers.

---

## II. Composition Modules (`src/modules/*.module.ts`)

Entry modules that wire datasource DI + domain modules per Lambda:

| File                    | Lambda  | Imports                                          |
| ----------------------- | ------- | ------------------------------------------------ |
| `public-api.module.ts`  | REST    | `CommonUserRepo`, `UserRestModule`, `AppConfig`  |
| `appsync-api.module.ts` | GraphQL | `CommonUserRepo`, `UserGraphModule`, `AppConfig` |

`CommonUserRepo` wires `DatabaseDatasourceModule` (transitive: `SecretsManagerDatasourceModule`).

---

## III. Feature Module (`src/modules/<name>/`)

```
src/modules/<name>/
├── <name>.rest.module.ts      # REST module (or .graph.module.ts)
├── <name>.const.ts            # DI symbols
├── controllers/               # REST / GraphQL controllers
├── dtos/
│   ├── requests/
│   └── responses/
├── repos/
│   ├── <name>.repo.ts         # [Interface]
│   └── implements/
│       └── <name>.repo.impl.ts
└── usecases/
    ├── <name>.uc.ts           # [Interface]
    └── implement/
        └── <name>.uc.impl.ts
```

### Active modules

| Module  | REST        | GraphQL                   |
| ------- | ----------- | ------------------------- |
| `user/` | `GET /user` | `createUserInfo` mutation |

---

## IV. `src/common/` — Shared Infrastructure

```
src/common/
├── constants/                 # APP_CONST, RESULT_CODE, DI tokens (di.const.ts)
├── datasources/               # Port/adapter per AWS capability
│   └── <capability>/
│       ├── *.datasource.ts
│       └── implements/
├── decorators/                # @Module, @Get, @Route, @ValidationArgs
├── errors/
├── lambda/                    # Lambda wrapper + pipeline pipes
├── logger/
├── repos/
│   ├── base/
│   └── user/                  # Shared IUserRepo (nickname lookup)
├── responses/
├── types/
└── utils/
```

Datasource DI modules live in `src/config/di/datasources/`. Common repo DI modules live in `src/config/di/repos/`. Only modules imported by `PublicApiModule` / `AppsyncApiModule` are wired at runtime.

---

## V. `src/config/`

```
src/config/
├── app.config.ts              # Injectable env config
├── di/
│   ├── di.config.ts           # bootstrapApplication / getInstance
│   ├── datasources/           # One *.di.ts per datasource
│   └── repos/                 # Shared repo DI (e.g. CommonUserRepo)
└── routes/
    ├── rest-api-router.ts     # REST routing (@Get decorator)
    └── graph-ql-router.ts     # GraphQL routing (@Route decorator)
```

---

## VI. Tests (`tests/unit-test/`)

Tests mirror `src/` layout. Stubs live alongside tests:

```
tests/unit-test/modules/user/stubs/user.stub.ts
tests/unit-test/modules/user/controllers/*.test.ts
tests/unit-test/modules/user/repos/*.test.ts
tests/unit-test/modules/user/usecases/*.test.ts
```

**Convention:** all unit tests under `tests/`, not co-located in `src/`.

---

## VII. Layer Communication

```
presenter/lambdas/*.ts
  └─ Lambda / Pipeline
       └─ [logging pipe → error-handling pipe]
            └─ Router → Controller
                 └─ UseCase (*.uc.impl.ts)
                      └─ Repo (*.repo.impl.ts)
                           └─ Datasource (*.datasource.impl.ts)
```

| Layer                | Responsibility                  |
| -------------------- | ------------------------------- |
| **Presenter/Lambda** | AWS handler entry, DI bootstrap |
| **Controller**       | Route handler, validate input   |
| **Use Case**         | Business logic                  |
| **Repository**       | Data access per feature         |
| **Datasource**       | SDK/driver adapter, shared      |

---

## VIII. Naming Conventions

| Suffix                 | Role                      |
| ---------------------- | ------------------------- |
| `*.datasource.ts`      | Datasource interface      |
| `*.datasource.impl.ts` | Datasource implementation |
| `*.repo.ts`            | Repository interface      |
| `*.repo.impl.ts`       | Repository implementation |
| `*.uc.ts`              | Use case interface        |
| `*.uc.impl.ts`         | Use case implementation   |
| `*.di.ts`              | DI registration module    |
| `*.module.ts`          | Feature/app module        |
| `*.test.ts`            | Unit test                 |

Implementation folders use **`implements/`** for repos and datasources, **`implement/`** for use cases.

---

## IX. Configuration Files

| File                       | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `package.json`             | Scripts, dependencies                            |
| `tsconfig.json`            | Path aliases: `@/*` → `src/*`, `~/*` → `tests/*` |
| `vitest.config.mjs`        | Unit tests (mocks — no env file required)        |
| `deploy/scripts/bundle.js` | esbuild per API name                             |
