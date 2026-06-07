# Testing Strategy

> Loaded when writing, reviewing, or analyzing test code.

## Framework & Setup

- **Unit tests**: Vitest (`vitest.config.mjs`) — runs in-process with mocked dependencies
- **E2E tests**: Vitest (`vitest-e2e.config.mjs`) — invokes the **deployed** Lambda via AppSync/API Gateway
- **Unit test env**: mocks only — no `envs/.env` required
- **E2E test env**: copy `envs/.env.e2e.example` → `envs/.env.e2e`, fill in Cognito + ARN values

## Coverage Requirements

| Scope               | Target                | How                                                           |
| ------------------- | --------------------- | ------------------------------------------------------------- |
| New UseCase         | 100%                  | Unit tests                                                    |
| New Repository Impl | ≥ 80%                 | Unit tests                                                    |
| E2E (black-box)     | S + E aspects minimum | `lambda-generate-api-tests` / `lambda-generate-feature-tests` |

> E2E tests call the **deployed** service — they do not instrument local source code and do not contribute to Vitest coverage reports.

## Test File Structure

All unit tests live under `tests/unit-test/` and mirror the `src/` tree.

```
tests/
├── common/
│   └── helpers/              ← shared test helpers
├── unit-test/
│   ├── common/               ← tests for src/common
│   ├── config/               ← tests for src/config
│   └── modules/
│       └── {module}/
│           ├── controllers/
│           ├── usecases/
│           ├── repos/
│           └── dtos/
└── e2e/
    ├── config.ts             ← AWS config, Cognito config, REST URLs, CloudWatch config
    ├── helpers/
    │   ├── api-test-app.ts   ← getApiTestApp() — lifecycle orchestrator
    │   ├── cognito-auth.ts   ← Cognito login → { credentials, idToken }
    │   ├── requester.ts      ← sendGraphQL() / sendRest() with sensitive scan
    │   ├── graphql.ts        ← AppSync SigV4 signed request
    │   ├── rest-api.ts       ← API Gateway HTTP client (SigV4 or cookie auth)
    │   ├── db.ts             ← Prisma client for DB state assertions
    │   ├── cloudwatch-logs.ts ← CloudWatch Live Tail session
    │   └── sensitive-leak-detector.ts
    ├── graphql/              ← one file per GraphQL operation
    ├── rest/                 ← one file per REST endpoint
    └── features/             ← multi-step feature flows
```

When generating E2E tests, load:

- `.github/rules/e2e-testing-aspects.md` — aspect types (S, E, B, …) and patterns
- `.github/rules/e2e-testing-best-practices.md` — AAA, assertions, isolation

Skills: `lambda-generate-unit-tests`, `lambda-generate-api-tests`, `lambda-generate-feature-tests`.

## Fixture naming

Unit test stubs and mock data under `tests/unit-test/`:

| Location             | Naming                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `common/`, `config/` | Neutral — e.g. `sampleRecord`, `mockEvent`, `mockPayload`               |
| `modules/{module}/`  | Domain-specific OK — e.g. `createUserInfoStub` in `modules/user/stubs/` |

- Do not use domain names from modules you are not testing in shared-layer tests.
- Prefer `stubs/` under the module folder for reusable fixtures.

## Unit Test Pattern (UseCase)

```typescript
describe('UserUseCase', () => {
  let useCase: UserUseCase;
  let repoMock: IUserRepo;

  beforeEach(() => {
    repoMock = { saveUser: vi.fn() } as unknown as IUserRepo;
    useCase = new UserUseCase(repoMock);
  });

  it('should save user and return mapped response', async () => {
    vi.mocked(repoMock.saveUser).mockResolvedValue(mockUser);

    const result = await useCase.saveUser({ userNickname: 'Bob' }, mockAuthUser);

    expect(repoMock.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({ userNickname: 'Bob' }),
    );
    expect(result.userNickname).toBe('Bob');
  });
});
```

## Mock Pattern

```typescript
const repoMock = {
  saveUser: vi.fn(),
} as unknown as IUserRepo;
```

- Use `vi.fn()` for all mock methods.
- Reset mocks in `beforeEach` or use `vi.clearAllMocks()`.
- For AWS SDK datasources, use `aws-sdk-client-mock`.

## E2E Test Pattern

```typescript
import { cloudwatchConfig, e2eHookTimeouts } from '~/e2e/config';

describe('createUserInfo - E2E (Black-box)', () => {
  const app = getApiTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.appsyncLambda],
      // login is automatic — credentials from Cognito
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate(); // waits for logFlushWait, then asserts no sensitive data leaked
  }, e2eHookTimeouts.afterAll);

  describe('Functional - Happy Path', () => {
    test('S01: should create user info with valid input', async () => {
      // Arrange
      const variables = { input: { userNickname: 'alice' } };

      // Act
      const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

      // Assert
      expect(result.errors).toBeUndefined();
      expect(result.data?.createUserInfo.cognitoSub).toBeDefined();
      expect(result.data?.createUserInfo.userNickname).toBe('alice');

      // DB assertion (optional)
      const { cognitoSub } = result.data!.createUserInfo;
      const row = await app.db.client.user.findUnique({ where: { cognitoSub } });
      expect(row?.userNickname).toBe('alice');
    });
  });

  describe('Authorization', () => {
    test('A01: should return EB-001 when request has no identity', async () => {
      const result = await app.withoutAuth().sendGraphQL(CREATE_USER_INFO, { input: VALID_INPUT });
      expectUnauthorizedGraphQL(result); // EB-001 or AppSync UnauthorizedException
    });
  });
});
```

## What to Test

- **UseCase**: all business logic branches, error cases, edge cases
- **Repository**: data mapping, query formation, error wrapping
- **DataSource**: request/response parsing (use mocked SDK clients)
- **E2E**: happy path + all documented error codes (S + E aspects minimum)

## What NOT to Test

- Zod schema definitions (trivial)
- DI container wiring (covered by E2E)
- AWS SDK internals
- Generated Prisma client code
