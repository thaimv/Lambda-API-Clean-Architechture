# Project Coding Conventions — LambdaAPIs

> For AI-assisted development, also see `.github/rules/typescript-coding-standards.md` and `.github/rules/architecture.md`.

---

## 1. Code Conventions

### 1.1 Naming

| Item               | Convention                   | Example                                     |
| ------------------ | ---------------------------- | ------------------------------------------- |
| Files              | kebab-case                   | `create-user-info.request.dto.ts`           |
| Classes            | PascalCase                   | `UsersUseCase`, `UsersGraphController`      |
| Interfaces         | PascalCase with `I` prefix   | `IUsersRepo`, `IUsersUseCase`               |
| Types / DTOs       | PascalCase                   | `CreateUserInfoRequest`, `UserInfoResponse` |
| Variables / params | camelCase                    | `userId`, `userNickname`                    |
| Constants          | UPPER_SNAKE_CASE             | `RESULT_CODE`, `ERROR_MESSAGE`              |
| Zod schemas        | camelCase + `Schema` suffix  | `createUserInfoDtoSchema`                   |
| DI tokens (shared) | `DI.{NAME}` in `di.const.ts` | `DI.DB_CLIENT_DATASOURCE`                   |
| DI tokens (module) | `{MODULE}_DI_CONST.I{Name}`  | `USERS_DI_CONST.IUsersUseCase`              |

### 1.2 Folder and File Structure

- **Module root:** `src/modules/{module-name}/`
- **Layer folders inside a module:**
  - `controllers/` — REST / GraphQL controllers
  - `dtos/requests/`, `dtos/responses/` — Zod schemas + types
  - `repos/` — repository interface + `implements/`
  - `usecases/` — use case interface + `implement/`
- **Tests:** mirror `src/` under `tests/unit-test/modules/{module-name}/` (not inside `src/`).

### 1.3 Functions and Methods

- Keep functions short and single-purpose.
- Use early returns to reduce nesting.
- Add explicit return types on `async` functions.
- Boolean helpers: prefix with `is`, `has`, `can` (e.g. `isValid()`).

### 1.4 Error Handling

- Throw custom error classes from `src/common/errors/` — never raw `new Error(...)`.
- Use cases throw domain errors; **Lambda handlers do not use try/catch** — errors are caught by pipeline pipes (`ApiErrorHandlingPipe`, `GraphQLErrorHandlingPipe`).

```typescript
// Good — in use case
throw new ExistedError(ERROR_MESSAGE.USER_NICKNAME_ALREADY_EXISTS);

// Bad
throw new Error('userNickname already exists');
```

See [error-handling.md](./error-handling.md) for response formats and result codes.

### 1.5 Formatting and Imports

- **Prettier** for formatting; **ESLint** for lint rules.
- Max line length: 100 characters; indentation: 2 spaces.
- Import order:
  1. External packages
  2. Internal modules (`@/...`)
  3. Test aliases (`~/...`) — tests only
- Use `import type` for type-only imports.
- Path alias `@/` maps to `src/`.

### 1.6 GraphQL Routing

GraphQL field names must match `RouteName` in `src/common/constants/graphql-api.const.ts`.

```graphql
type Mutation {
  createUserInfo(input: UserInfoInput): UserInfoResponse!
}
```

```typescript
export enum RouteName {
  // ===== Query =====

  // ===== Mutation =====
  CREATE_USER_INFO = 'createUserInfo',
}
```

Controller wiring:

```typescript
@Route(RouteName.CREATE_USER_INFO)
@ValidationArgs(createUserInfoDtoSchema)
async create(event: TRequestEvent<CreateUserInfoRequest>, authUser: TAuthUser) {
  return this.usersUseCase.saveUser(event.arguments, authUser);
}
```

### 1.7 REST Routing

REST paths are defined in `src/common/constants/rest-api.const.ts` (`PathPublicRestApi`) and mapped via `@Get` / `@Post` decorators.

---

## 2. Git Conventions

### 2.1 Branch Naming

- Attach branches to a task or PBI ID.
- Format: `branch_wi{taskID}_{brief_description}`
  - Example: `branch_wi24110_create_user_info`

### 2.2 Branch Management

- Feature branches off `develop` (or main, per team policy).
- Open a PR for every feature/bugfix; link to the work item.
- Keep branches short-lived; merge regularly.

### 2.3 Commit Messages

- Imperative, concise; prefix with task ID when applicable.
  - Example: `#24567 feat: add createUserInfo mutation`
- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

---

## 3. Pull Request Conventions

### 3.1 PR Guidelines

- Clear description: purpose, summary of changes, test evidence.
- Keep PRs small and focused on one task.
- Address review comments promptly.

### 3.2 Review Checklist

- [ ] Follows Clean Architecture layer boundaries
- [ ] Input validated at controller boundary (Zod + `@ValidationArgs`)
- [ ] Custom error classes used (no raw `Error`)
- [ ] Unit tests added or updated under `tests/unit-test/`
- [ ] No unrelated changes; no dead code or unused imports
- [ ] `npm run test:ci`, `npm run lint`, `npm run build` pass
- [ ] API/design docs updated when behaviour changes

### 3.3 Merge Rules

- Merge only after approval and CI pass.
- Prefer **Squash and Merge** for a clean history.

---

## 4. CI/CD and Documentation

- Every PR runs automated tests via Azure Pipelines (`deploy/cicd/`).
- New features: update detail design docs under `document/detail-designs/` and README links when applicable.

---

## 5. IDE Setup

Recommended [VS Code](https://code.visualstudio.com/) extensions:

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- [GraphQL Syntax Highlighting](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql-syntax)
- [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
