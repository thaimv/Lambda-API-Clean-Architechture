# E2E Testing Aspects

Industry-standard testing aspects for **Vitest E2E** tests against LambdaAPI (AppSync GraphQL + REST).

Each aspect maps to a `describe` block and a test ID prefix. Not every aspect applies to every API — use judgment from the detail design / feature spec.

---

## Prioritization

| Priority | Prefix | Aspect                    | When                                                     |
| -------- | ------ | ------------------------- | -------------------------------------------------------- |
| 1        | `S`    | Functional / Happy Path   | Always                                                   |
| 2        | `E`    | Negative / Error Handling | Always — one test per documented error code              |
| 3        | `B`    | Boundary Value Analysis   | Fields with min/max length or range constraints          |
| 4        | `EP`   | Equivalence Partitioning  | Enum, UUID, fixed-format fields                          |
| 5        | `ST`   | State Transition          | Mutations with verifiable side effects                   |
| 6        | `N`    | Null / Optional Fields    | Schema has nullable or optional fields                   |
| 7        | `I`    | Idempotency               | Mutations that can be safely retried                     |
| 8        | `A`    | Authorization / Security  | Protected endpoints (requires unauthenticated requester) |

---

## Aspect S — Functional / Happy Path

Test that the API performs its intended business function correctly.

**When to apply:** Always. One test per distinct success path.

- **S01** — Full happy path: valid inputs → success response with expected fields/types **and DB row matches when API touches the database**.
- **S02+** — Conditional branches: separate test per documented branch (e.g. upsert creates new vs updates existing).

```typescript
test('S01: should create user info with valid input', async () => {
  // Arrange
  const variables = { input: { userNickname: 'alice' } };

  // Act
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

  // Assert
  expect(result.errors).toBeUndefined();
  expect(result.data?.createUserInfo.cognitoSub).toBeDefined();
  expect(result.data?.createUserInfo.userNickname).toBe('alice');

  const row = await app.db.client.user.findUnique({
    where: { cognitoSub: result.data!.createUserInfo.cognitoSub },
  });
  expect(row?.userNickname).toBe('alice');
});
```

---

## Aspect E — Negative / Error Handling

Invalid inputs rejected with the correct **RESULT_CODE**.

**When to apply:** At least one test per error condition documented in the detail design.

**Error codes (this project):**

| Code     | Class               | Typical case                   |
| -------- | ------------------- | ------------------------------ |
| `EB-001` | Unauthorized        | Missing/invalid auth           |
| `EB-002` | BadRequest          | Business rule violation        |
| `EB-003` | NotFound            | Resource missing               |
| `EB-004` | Validation          | Zod / input validation failure |
| `EB-009` | Existed             | Duplicate resource             |
| `ES-001` | InternalServerError | Unexpected failure             |

```typescript
test('E01: should return EB-004 when userNickname is empty', async () => {
  // Arrange
  const variables = { input: { userNickname: '' } };

  // Act
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, variables);

  // Assert
  expect(result.errors).toBeDefined();
  expect(result.errors![0].errorType).toBe('EB-004');
  expect(result.data?.createUserInfo).toBeFalsy();
});
```

---

## Aspect B — Boundary Value Analysis

Test inputs at the edges of valid ranges.

**When to apply:** Fields with length/range constraints in the detail design or Zod schema.

- **B01 (min valid):** Exactly at minimum → success
- **B02 (below min):** One below minimum → `EB-004`
- **B03 (max valid):** Exactly at maximum → success
- **B04 (above max):** One above maximum → `EB-004`

```typescript
test('B01: should accept userNickname at min length (1 char)', async () => {
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
    input: { ...VALID_INPUT, userNickname: 'a' },
  });
  expect(result.errors).toBeUndefined();
});

test('B02: should return EB-004 when userNickname is empty after trim', async () => {
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
    input: { ...VALID_INPUT, userNickname: '' },
  });
  expect(result.errors![0].errorType).toBe('EB-004');
});
```

---

## Aspect EP — Equivalence Partitioning

One representative value per valid/invalid equivalence class.

**When to apply:** Enum, UUID, code, or identity format fields.

| Field type     | Valid example | Invalid example  |
| -------------- | ------------- | ---------------- |
| `userNickname` | `"alice"`     | `""` after trim  |
| Enum field     | `"TYPE_A"`    | `"UNKNOWN_TYPE"` |

```typescript
test('EP01: should return EB-004 when userNickname is empty string', async () => {
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
    input: { ...VALID_INPUT, userNickname: '' },
  });
  expect(result.errors![0].errorType).toBe('EB-004');
});

test('EP02: should succeed with a valid alternative nickname', async () => {
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
    input: { ...VALID_INPUT, userNickname: 'bob' },
  });
  expect(result.errors).toBeUndefined();
});
```

---

## Aspect ST — State Transition

Verify that mutations produce observable side effects — prefer **DB read-back** over a second API call when the design does not expose a dedicated read endpoint.

**When to apply:** Mutations with verifiable side effects (created record, updated field, deleted row).
**S01** already asserts DB for simple create/update; **ST01** covers multi-step transitions (e.g. update then read via another endpoint, or verify fields not returned by the mutation response).

```typescript
test('ST01: created user info should be persisted in the database', async () => {
  // Mutate
  const mutation = await app.requester.sendGraphQL(CREATE_USER_INFO, {
    input: VALID_INPUT,
  });
  expect(mutation.errors).toBeUndefined();
  const { cognitoSub } = mutation.data?.createUserInfo;

  // Read back via DB — state must be persisted
  const row = await app.db.client.user.findUnique({ where: { cognitoSub } });
  expect(row?.userNickname).toBe(VALID_INPUT.userNickname);
});
```

---

## Aspect N — Null / Optional Fields

Optional or nullable fields are handled correctly when absent or null.

**When to apply:** Schema marks fields as optional (input) or nullable (response).

```typescript
test('N01: should succeed when optional cognitoId is omitted', async () => {
  const { cognitoId, ...inputWithoutOptional } = VALID_INPUT;
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, {
    input: inputWithoutOptional,
  });
  expect(result.errors).toBeUndefined();
});

test('N02: should return null for nullable cognitoId when not set', async () => {
  // Verify via DB that cognitoId is null when not provided
  const { cognitoSub } = (await app.requester.sendGraphQL(CREATE_USER_INFO, { input: VALID_INPUT }))
    .data!.createUserInfo;
  const row = await app.db.client.user.findUnique({ where: { cognitoSub } });
  expect(row?.cognitoId).toBeNull();
});
```

---

## Aspect I — Idempotency / Duplicate Handling

Same mutation called twice behaves as designed (upsert or conflict).

**When to apply:** Mutations only. Omit for queries.

```typescript
test('I01: should handle duplicate createUserInfo per design (upsert or EB-009)', async () => {
  await app.requester.sendGraphQL(CREATE_USER_INFO, { input: VALID_INPUT });
  const result = await app.requester.sendGraphQL(CREATE_USER_INFO, { input: VALID_INPUT });

  // Uncomment whichever matches the detail design:
  // expect(result.errors![0].errorType).toBe('EB-009'); // duplicate rejected
  // expect(result.errors).toBeUndefined();              // upsert — second call succeeds
});
```

---

## Aspect A — Authorization / Security

Unauthenticated or unauthorized requests are rejected.

**When to apply:** Protected endpoints. Use `app.withoutAuth()` to get a requester with no credentials.

**GraphQL (AppSync + IAM):** `withoutAuth()` typically yields AppSync `UnauthorizedException`, not Lambda `EB-001`. Use `expectUnauthorizedGraphQL()` from `~/e2e/helpers/common`.

**REST (API Gateway + IAM):** assert non-200 `statusCode` (often 403), not body `EB-001`.

```typescript
import { expectUnauthorizedGraphQL } from '~/e2e/helpers/common';

test('A01: should reject request without credentials', async () => {
  const result = await app.withoutAuth().sendGraphQL(CREATE_USER_INFO, { input: VALID_INPUT });
  expectUnauthorizedGraphQL(result);
  expect(result.data?.createUserInfo).toBeFalsy();
});
```

---

## Test ID Naming Convention

| Prefix | Aspect                    | Example                    |
| ------ | ------------------------- | -------------------------- |
| `S`    | Functional / Happy Path   | `S01`, `S02`               |
| `E`    | Negative / Error Handling | `E01`, `E02`               |
| `B`    | Boundary Value Analysis   | `B01`, `B02`, `B03`, `B04` |
| `EP`   | Equivalence Partitioning  | `EP01`, `EP02`             |
| `ST`   | State Transition          | `ST01`                     |
| `N`    | Null / Optional Fields    | `N01`, `N02`               |
| `I`    | Idempotency               | `I01`                      |
| `A`    | Authorization / Security  | `A01`                      |

---

## `describe` Block Structure

```typescript
import { cloudwatchConfig, e2eHookTimeouts } from '~/e2e/config';

describe('<API or Feature> - E2E (Black-box)', () => {
  const app = getApiTestApp();

  beforeAll(async () => {
    await app.bootstrap({
      logGroupArns: [cloudwatchConfig.logGroupArns.appsyncLambda],
      // login is automatic — Cognito credentials resolved inside bootstrap()
    });
  }, e2eHookTimeouts.beforeAll);

  afterAll(async () => {
    await app.terminate();
  }, e2eHookTimeouts.afterAll);

  describe('Functional - Happy Path', () => {
    /* S */
  });
  describe('Negative - Error Handling', () => {
    /* E */
  });
  describe('Boundary Value Analysis', () => {
    /* B — when constraints exist */
  });
  describe('Equivalence Partitioning', () => {
    /* EP — enum/format fields */
  });
  describe('State Transition', () => {
    /* ST — mutations with side effects */
  });
  describe('Null / Optional Fields', () => {
    /* N — nullable/optional fields */
  });
  describe('Idempotency', () => {
    /* I — mutations only */
  });
  describe('Authorization', () => {
    /* A — protected endpoints */
  });
});
```
