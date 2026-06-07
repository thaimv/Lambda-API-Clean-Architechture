# E2E Test Case Best Practices

Standards for high-quality, maintainable **E2E** test cases in LambdaAPI.
Apply when generating tests via `lambda-generate-api-tests` or `lambda-generate-feature-tests`.

---

## Structure & Organization

- **AAA Pattern** — **Arrange** → **Act** → **Assert** in every test.
- **One assertion intent per test** — Multiple `expect()` calls OK if they verify one outcome.
- **Descriptive test names** — `should <do X> when <condition Y>`; include test ID prefix (`S01`, `E01`, …).
- **Group by aspect** — `describe` blocks follow `e2e-testing-aspects.md` priority order.

---

## Test Data

- **No magic literals** — Use named constants (`VALID_INPUT`, `VALID_NICKNAME`).
- **Defaults from detail design** — Example request/response in `document/detail-designs/`.
- **Deterministic branching** — Random IDs OK; branch-driving values must be fixed.
- **No shared mutable state across tests** — Fresh data per test unless sequential S01→S02 in same `describe`.

---

## Assertions

- **Assert observable contract** — Response shape and RESULT_CODE, not internal implementation.
- **Assert DB when API touches data** — After Act, query `app.db.client.<model>` and compare persisted fields to both the API response and expected Arrange values. Do not rely on response alone for read/write APIs.
- **Explicit over implicit** — `toBe('SC-001')` not `toBeTruthy()` for codes.
- **Error tests: no data leak** — `result.data?.field` should be `null`/`undefined` on error responses.
- **Guard nullable fields** — Optional chaining before nested property access.

```typescript
// ✅ Good
expect(result.errors).toBeUndefined();
expect(result.data?.createUserInfo.cognitoSub).toBeDefined();

// ❌ Bad
expect(result).toBeTruthy();
expect(result.data.createUserInfo.cognitoSub).toBeDefined();
```

---

## Independence & Isolation

- **No test-order dependency** — Each test passes when run alone (`vitest run path/to/file.e2e-spec.ts`).
- **Self-contained setup** — Create needed state in test or scoped `beforeAll`.
- **Avoid teardown** unless spec requires cleanup — E2E often leaves test data in dev DB.

---

## Readability & Maintainability

- **Comment the "why"** — Business reason, not restating code.
- **Step comments for flows** — `// Step 1: createUserInfo`, `// Step 2: getCurrentUser`
- **File-level JSDoc** — Summarize API/feature and state-passing contract at top.
- **DRY setup, not assertions** — Helpers for repeated GraphQL strings / REST operations.

---

## Coverage Completeness

- **Each documented branch** gets a test.
- **Contract-level E2E** — Inputs → outputs; unit tests cover use case internals.
- **Trace to spec** — Test ID + comment mapping to detail design section or workflow step.

---

## Project Conventions

| Item             | Convention                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GraphQL E2E      | `tests/e2e/graphql/<kebab-operation>.e2e-spec.ts`                                                                       |
| REST E2E         | `tests/e2e/rest/<kebab-endpoint>.e2e-spec.ts`                                                                           |
| Feature E2E      | `tests/e2e/features/<kebab-feature>.e2e-spec.ts`                                                                        |
| Config           | `vitest-e2e.config.mjs`, env from `envs/.env.e2e` (copy from `envs/.env.e2e.example`)                                   |
| App orchestrator | `~/e2e/helpers/api-test-app` — `getApiTestApp()`                                                                        |
| GraphQL call     | `app.requester.sendGraphQL(QUERY, variables)`                                                                           |
| REST call        | `app.requester.sendRest('GET', '/path')`                                                                                |
| Unauthenticated  | `app.withoutAuth().sendGraphQL(...)` / `.sendRest(...)` — for A aspect tests                                            |
| DB assertions    | **Required** when API reads/writes DB — `app.db.client.<model>.findUnique(...)` in S01; ST01 for multi-step transitions |
| Cognito login    | automatic in `app.bootstrap()` — no `login: true` needed                                                                |
| Schema source    | `src/presenter/graphql/schema.graphql`                                                                                  |
| API specs        | `document/detail-designs/graphql/`, `.../rest/`                                                                         |
| Feature specs    | `document/specs/<feature>/index.md`, `brain/features/`                                                                  |
