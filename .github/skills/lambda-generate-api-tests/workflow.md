# lambda-generate-api-tests Workflow

## Reference Files

| File                                          | Read at | Purpose                                    |
| --------------------------------------------- | ------- | ------------------------------------------ |
| `.github/rules/e2e-testing-aspects.md`        | Step 4  | 8 aspects, test ID prefixes                |
| `.github/rules/e2e-testing-best-practices.md` | Step 4  | AAA, assertions, isolation                 |
| `document/standardization/error-handling.md`  | Step 4  | RESULT_CODE values                         |
| `src/presenter/graphql/schema.graphql`        | Step 4  | GraphQL types (GraphQL only)               |
| `tests/e2e/helpers/api-test-app.ts`           | Step 5  | `getApiTestApp()`, `ApiTestApp` lifecycle  |
| `tests/e2e/helpers/db.ts`                     | Step 4  | `app.db.client` — Prisma for DB assertions |
| `tests/e2e/config.ts`                         | Step 5  | `cloudwatchConfig.logGroupArns`            |
| `prisma/schema.prisma`                        | Step 4  | Model/table names for DB assertions        |

## Prerequisites

- E2E helpers must exist under `tests/e2e/helpers/`.
- Local env: `envs/.env.e2e` for `npm run test:e2e`.

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse `{path-or-name}` per `manifest.yaml` → `input`:
   - **Full path** → use as-is.
   - **Name only** → search `document/detail-designs/graphql/` and `document/detail-designs/rest/`.
3. Confirm detail design file exists — if missing → **stop and report** expected path.
4. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.

---

## Step 2 — Read & Understand the API

- **API style** — GraphQL (`appsync-api`) vs REST (`public-api` / `auth-api`)
- **Operation or route** — e.g. `createUserInfo`, `GET /user`
- **Input / validation** — Zod rules, required fields
- **Success response** — fields and types
- **Errors** — map to `RESULT_CODE` (`EB-003`, `EB-004`, …)
- **Example request/response** — default test data

GraphQL only: read `src/presenter/graphql/schema.graphql` for nullability.

### Database side effects (required analysis)

Read the **Coding Design** section and source (use case / repo) to determine whether the API **reads from** or **writes to** the database.

| API behavior                         | DB assertion requirement                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Mutation creates/updates/deletes row | **S01** (and **ST01** when state transition is non-trivial) must call `app.db.client` |
| Query/GET reads persisted data       | **S01** must compare API response fields with the DB row for the same key             |
| Validation-only / no DB touch        | Skip DB assertions — note in report                                                   |

Use `prisma/schema.prisma` for the Prisma model name (e.g. `user` → `app.db.client.user`).
Map response field names to DB column fields (e.g. `cognitoSub` → `user.cognitoSub`).

### CloudWatch Live Tail (which log groups?)

Tail **only Lambdas actually invoked in this spec** — including Arrange/setup steps, not every Lambda in the repo.

| Spec invokes                         | `logGroupArns` in `beforeAll`                                     |
| ------------------------------------ | ----------------------------------------------------------------- |
| GraphQL only (e.g. `createUserInfo`) | `[cloudwatchConfig.logGroupArns.appsyncLambda].filter(Boolean)`   |
| REST `public-api` only               | `[cloudwatchConfig.logGroupArns.publicApiLambda].filter(Boolean)` |
| Multiple Lambdas                     | list each ARN needed — only those actually invoked in the spec    |

Add a comment in `beforeAll` when the choice is not obvious.

---

## Step 3 — Clarify Assumptions

Ask one question at a time if constraints or error codes are unclear.

---

## Step 4 — Generate Test Cases (8 Aspects)

Read `e2e-testing-aspects.md` and `e2e-testing-best-practices.md`.

| Aspect | Condition           | Notes                                             |
| ------ | ------------------- | ------------------------------------------------- |
| S      | Always              | One test per success branch                       |
| E      | Always              | One test per documented RESULT_CODE               |
| B      | Constrained fields  | From Zod / design table                           |
| EP     | Format/enum fields  | nicknames, enum values, fixed-format fields       |
| ST     | Stateful behavior   | Mutations with side effects; include DB read-back |
| N      | Optional fields     | e.g. nullable `cognitoId`                         |
| I      | Mutations only      | Skip for queries / GET                            |
| A      | Protected endpoints | Use `app.withoutAuth()` — always available        |

---

## Step 5 — Write the Test File

### Output paths

| Style   | Path                                              |
| ------- | ------------------------------------------------- |
| GraphQL | `tests/e2e/graphql/<kebab-operation>.e2e-spec.ts` |
| REST    | `tests/e2e/rest/<kebab-endpoint>.e2e-spec.ts`     |

### Templates

- GraphQL → `.github/skills/lambda-generate-api-tests/templates/graphql.e2e-spec.ts`
- REST → `.github/skills/lambda-generate-api-tests/templates/rest.e2e-spec.ts`

### Code style

| Rule             | Detail                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lifecycle        | `const app = getApiTestApp()` + `beforeAll/afterAll` with `app.bootstrap({ logGroupArns })` / `app.terminate()`                                                                                                                                                                                                                                                                                        |
| Timeout          | `e2eHookTimeouts.beforeAll` / `e2eHookTimeouts.afterAll` from `~/e2e/config` — **afterAll must exceed `CLOUDWATCH_LOG_FLUSH_WAIT`** (terminate sleeps that long)                                                                                                                                                                                                                                       |
| GraphQL call     | `app.requester.sendGraphQL(QUERY, variables)`                                                                                                                                                                                                                                                                                                                                                          |
| GraphQL success  | `expect(result.errors).toBeUndefined()` then assert `result.data`                                                                                                                                                                                                                                                                                                                                      |
| GraphQL error    | `expect(result.errors![0].errorType).toBe('EB-xxx')` for Lambda/domain errors (EB-004, EB-009, …)                                                                                                                                                                                                                                                                                                      |
| GraphQL auth (A) | `expectUnauthorizedGraphQL(result)` from `~/e2e/helpers/common` — `EB-001` or `UnauthorizedException`                                                                                                                                                                                                                                                                                                  |
| REST call        | `app.requester.sendRest('GET' \| 'POST', '/path', body?)` — check `result.statusCode` and `result.body`                                                                                                                                                                                                                                                                                                |
| Log groups       | `[cloudwatchConfig.logGroupArns.<lambda>].filter(Boolean)` — only Lambdas invoked in this spec                                                                                                                                                                                                                                                                                                         |
| REST error       | `expect(result.statusCode).toBe(4xx)` or check `result.body?.result?.code`                                                                                                                                                                                                                                                                                                                             |
| Unauthenticated  | `app.withoutAuth().sendGraphQL(...)` / `.sendRest(...)` for A aspect                                                                                                                                                                                                                                                                                                                                   |
| DB assertions    | **Required** when API reads/writes DB — use in **S01** (and **ST01** for mutations). Pattern: Act via API → `app.db.client.<model>.findUnique(...)` → assert response fields match row. REST-only specs: seed via `upsertAuthenticatedUser(app, nickname)` in `~/e2e/helpers/common`, not GraphQL. Use **`upsert`** (not `create`) for fixed-PK seed rows. Requires `DATABASE_URL` in `envs/.env.e2e`. |
| Logs             | automatic — `terminate()` asserts no raw sensitive values (passwords, tokens) leaked to CloudWatch                                                                                                                                                                                                                                                                                                     |
| AAA comments     | `// Arrange`, `// Act`, `// Assert`                                                                                                                                                                                                                                                                                                                                                                    |
| eslint           | `/* eslint-disable max-lines-per-function */` at top                                                                                                                                                                                                                                                                                                                                                   |

---

## Step 6 — Verify Output & Report

| Check           | Pass when                          |
| --------------- | ---------------------------------- |
| Test file       | Created at expected path           |
| Output contract | Matches `manifest.yaml` → `output` |

1. Output file path
2. Test count per aspect
3. Assumptions (inferred codes, missing helper methods)
4. TODOs (env vars, auth fixtures)

Suggest `manifest.yaml` → `next_skill` when complete.
