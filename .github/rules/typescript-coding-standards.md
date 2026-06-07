# TypeScript Coding Standards

> Loaded when writing, reviewing, or refactoring TypeScript code.

## General

- **TypeScript strict mode** is enabled (`tsconfig.json`). No `any` unless absolutely necessary and commented.
- Use `const` by default; `let` only when reassignment is needed. Never `var`.
- Prefer `async/await` over `.then()/.catch()` chains.
- Prefer named exports over default exports (easier to refactor and grep).

## Naming Conventions

| Item                       | Convention                                   | Example                                     |
| -------------------------- | -------------------------------------------- | ------------------------------------------- |
| Files                      | kebab-case                                   | `create-user-info.uc.ts`                    |
| Classes                    | PascalCase                                   | `UsersUseCase`                              |
| Interfaces                 | PascalCase with `I` prefix                   | `IUsersRepo`                                |
| Types / DTOs               | PascalCase                                   | `CreateUserInfoRequest`, `UserInfoResponse` |
| Variables / params         | camelCase                                    | `userId`, `userNickname`                    |
| Constants                  | UPPER_SNAKE_CASE                             | `MAX_RETRY_COUNT`                           |
| Shared DI tokens           | UPPER_SNAKE_CASE key in `DI` object          | `DI.DB_CLIENT_DATASOURCE`                   |
| Module DI tokens           | `I`-prefixed key in `{MODULE}_DI_CONST`      | `USERS_DI_CONST.IUsersUseCase`              |
| Datasource DI module class | `{Name}DatasourceModule` in `*.di.ts`        | `DatabaseDatasourceModule`                  |
| Datasource implementation  | `{Name}Datasource` in `*.datasource.impl.ts` | `PrismaDbClientDatasource`                  |
| Common repo DI module      | PascalCase, no `Module` suffix               | `CommonUserRepo`                            |
| Zod schemas                | camelCase with `Schema` suffix               | `createUserInfoDtoSchema`                   |
| Lambda handler             | `handler` (named export)                     | `export const handler`                      |

## File Naming Suffixes

| Suffix             | Meaning                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `.controller.ts`   | Controller (wires handler → use case)                            |
| `.uc.ts`           | Use case interface                                               |
| `.uc.impl.ts`      | Use case implementation                                          |
| `.repo.ts`         | Repository interface                                             |
| `.repo.impl.ts`    | Repository implementation                                        |
| `.dto.ts`          | DTO (request or response, with Zod schema)                       |
| `.module.ts`       | `@Module` declaration (`*.rest.module.ts` / `*.graph.module.ts`) |
| `.const.ts`        | Module DI tokens / constants                                     |
| `.di.ts`           | Datasource DI module (`src/config/di/datasources/`)              |
| `{lambda-name}.ts` | Lambda entry point (presenter), e.g. `public-rest-api.ts`        |
| `.test.ts`         | Unit test (under `tests/`)                                       |

## Class Patterns

### Use Case

```typescript
@injectable()
export class UsersUseCase implements IUsersUseCase {
  constructor(@inject(USERS_DI_CONST.IUsersRepo) private readonly usersRepo: IUsersRepo) {}

  async saveUser(userInfo: CreateUserInfoRequest, authUser: TAuthUser): Promise<UserInfoResponse> {
    // business logic only
  }
}
```

### Repository Interface

```typescript
export interface IUsersRepo {
  saveUser(params: CreateUserInfoRequest, authUser: TAuthUser): Promise<User>;
}
```

### Repository Implementation

```typescript
@injectable()
export class UsersRepo implements IUsersRepo {
  constructor(
    // Shared datasource token from common/constants/di.const.ts
    @inject(DI.DB_CLIENT_DATASOURCE) private readonly dbClient: DBClient,
  ) {}
}
```

## Error Handling

- Use custom error classes from `src/common/errors/`.
- Always classify errors before throwing. Do NOT throw generic `new Error("something failed")`.
- UseCase should catch DataSource/Repository errors and rethrow as domain errors if needed.

```typescript
// Good
throw new NotFoundError(`User ${userId} not found`);

// Bad
throw new Error(`User ${userId} not found`);
```

## Imports

- Group imports: external packages → internal modules → relative files.
- Use the `@/` path alias (maps to `src/`), e.g. `@/common/...`, `@/modules/users/...`.
- Never use `require()` — always ES module `import`. Use `import type` for type-only imports.

## Zod Schemas

- Co-locate request schemas in `src/modules/{module}/dtos/requests/` (responses in `dtos/responses/`).
- Export both the schema and the inferred type.

```typescript
export const createUserInfoDtoSchema = z.object({
  input: z.object({
    userNickname: z.string().trim().min(1),
  }),
});
export type CreateUserInfoRequest = z.infer<typeof createUserInfoDtoSchema>;
```

## DI Tokens

- Tokens are `Symbol.for(...)`. There is no `TYPES`/`di.tokens.ts`.
- Shared infrastructure tokens live in `src/common/constants/di.const.ts` (the `DI` object).
- Module tokens live in `src/modules/{module}/{module}.const.ts`.

```typescript
// src/modules/users/users.const.ts
export const USERS_DI_CONST = {
  IUsersRepo: Symbol.for('IUsersRepo'),
  IUsersUseCase: Symbol.for('IUsersUseCase'),
};
```

## async/await Rules

- Every `async` function must have explicit return type.
- Catch errors at the appropriate boundary (Lambda handler), not deep inside use cases unless re-throwing a domain error.
- Use `Promise.all()` for parallel independent async operations.
