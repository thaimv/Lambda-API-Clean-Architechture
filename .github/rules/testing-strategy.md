# Testing Strategy

> Loaded when writing, reviewing, or analyzing test code.

## Framework & Setup

- **Unit tests**: Vitest (`vitest.config.mjs`) — runs in-process, no Lambda cold start
- **E2E tests**: Vitest (`vitest-e2e.config.mjs`) — invokes the Lambda handler end-to-end
- **Environment**: unit tests use mocks — no env file required (`envs/.env` only for local runs / E2E)
- **Mocks**: constructor injection with mock implementations (no DI container in unit tests)

## Coverage Requirements

| Scope               | Target        |
| ------------------- | ------------- |
| New UseCase         | 100%          |
| New Repository Impl | ≥ 80%         |
| New Lambda Handler  | ≥ 80% via E2E |

## Test File Structure

All tests live under `tests/` and **mirror the `src/` tree** (tests are not inside `src/modules/`).

```
tests/
├── common/
│   └── helpers/          ← shared test helpers (e.g. app-config.helper.ts, test.helper.ts)
└── unit-test/
    ├── common/           ← tests for src/common (datasources, utils, pipes, ...)
    ├── config/           ← tests for src/config (routers, di.config, app.config)
    └── modules/
        └── {module}/
            ├── controllers/
            ├── usecases/
            ├── repos/
            └── dtos/
```

E2E tests use `vitest-e2e.config.mjs` and invoke the bundled Lambda handler end-to-end.

## Unit Test Pattern (UseCase)

```typescript
describe('UsersUseCase', () => {
  let useCase: UsersUseCase;
  let usersRepoMock: MockUsersRepo;

  beforeEach(() => {
    usersRepoMock = new MockUsersRepo();
    useCase = new UsersUseCase(usersRepoMock);
  });

  it('should save user and map to response', async () => {
    usersRepoMock.saveUser.mockResolvedValue(mockUser);

    const result = await useCase.saveUser({ input: { userNickname: 'Bob' } }, authUser);

    expect(usersRepoMock.saveUser).toHaveBeenCalled();
    expect(result.userNickname).toBe(mockUser.userNickname);
  });
});
```

## Mock Pattern

```typescript
// Mock a repository interface
export class MockUsersRepo implements IUsersRepo {
  saveUser = vi.fn();
}
```

- Use `vi.fn()` for all mock methods.
- Reset mocks in `beforeEach` or use `vi.clearAllMocks()`.
- Prefer explicit mock implementations over `vi.spyOn`.
- For AWS SDK datasources, use `aws-sdk-client-mock`.

## E2E Test Pattern

```typescript
// Invoke the Lambda handler end-to-end
describe('GET current user', () => {
  it('should return 200', async () => {
    const event = buildApiGatewayEvent('GET', '/users/me');
    const response = await handler(event, mockContext, () => {});
    expect(response?.statusCode).toBe(200);
  });
});
```

## What to Test

- UseCase: all business logic branches, error cases, edge cases
- Repository: data mapping, query formation, error wrapping
- DataSource: request/response parsing (use mocked SDK clients)
- Lambda handler (E2E): happy path + common error cases (400, 404, 500)

## What NOT to Test

- Zod schema definitions (trivial)
- DI container wiring (covered by E2E)
- AWS SDK internals
- Generated Prisma client code
