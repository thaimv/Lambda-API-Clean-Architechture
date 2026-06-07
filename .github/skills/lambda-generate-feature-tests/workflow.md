# lambda-generate-feature-tests Workflow

## Reference Files

| File                                          | Read at | Purpose                                    |
| --------------------------------------------- | ------- | ------------------------------------------ |
| `.github/rules/e2e-testing-aspects.md`        | Step 5  | 8 aspects, prioritization                  |
| `.github/rules/e2e-testing-best-practices.md` | Step 5  | AAA, isolation, readability                |
| `document/standardization/error-handling.md`  | Step 3  | RESULT_CODE                                |
| Referenced detail designs                     | Step 3  | Per-API GraphQL/REST contracts             |
| `tests/e2e/helpers/db.ts`                     | Step 3  | `app.db.client` — Prisma for DB assertions |
| `prisma/schema.prisma`                        | Step 3  | Model/table names for DB assertions        |

## Prerequisites

- `tests/e2e/helpers/api-test-app.ts` (`getApiTestApp`) and `tests/e2e/config.ts` (`cloudwatchConfig`) must exist.
- Feature spec exists in repo (see Step 1).

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse `{feature-name-or-spec-path}` per `manifest.yaml` → `input`:
   - **Full path** → use as-is.
   - **Name only** → search `document/specs/<name>/index.md` and `.github/brain/features/<name>.md`.
3. Confirm feature spec exists — if missing → **stop and report**:
   ```
   Feature spec not found. Create document/specs/<name>/index.md or brain/features/<name>.md first.
   ```
4. Kebab-case output name: `"User Profile Bootstrap"` → `user-profile-bootstrap`
5. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.

---

## Step 2 — Read the Feature Spec

### Workflow

From Mermaid `graph TD` or numbered steps:

- Step names (e.g. `createUserInfo`, `getCurrentUser`)
- Success / failure edges
- Conditional branches

### State passing

For each step: which fields come from request vs prior step response vs derived.

### Referenced APIs

Links to `document/detail-designs/graphql/` or `rest/` — read each for operation names and fields. Note missing files in Step 7 assumptions.

### Database side effects (required analysis)

For each step, read the **Coding Design** and source to determine whether it **reads from** or **writes to** the database.

| Step behavior                        | DB assertion requirement                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Mutation creates/updates/deletes row | **S01** (and **ST01** when state transition is non-trivial) must call `app.db.client` |
| Query/GET reads persisted data       | **S01** must compare API response fields with the DB row for the same key             |
| Validation-only / no DB touch        | Skip DB assertions for that step — note in report                                     |

Use `prisma/schema.prisma` for the Prisma model name (e.g. `user` → `app.db.client.user`).
Map response field names to DB column fields.

---

## Step 3 — Clarify Assumptions

One question at a time if workflow or error behavior is ambiguous.

---

## Step 4 — Generate Test Cases (8 Aspects)

| Aspect | Condition          | Feature override                                     |
| ------ | ------------------ | ---------------------------------------------------- |
| S      | Always             | One test per success branch / conditional exit       |
| E      | Always             | One failure per step; `// Flow cannot continue — …`  |
| B      | Constrained fields | From referenced API designs                          |
| EP     | Format fields      | Identity, nicknames, tokens                          |
| ST     | Multi-step         | State Step N → N+1; include DB read-back at flow end |
| N      | Optional fields    | Omit optional inputs                                 |
| I      | Mutations in flow  | Skip for read-only workflows                         |
| A      | Protected flows    | Use `app.withoutAuth()` — always available           |

Use GraphQL and/or REST helpers depending on steps (mixed flows allowed).

---

## Step 5 — Write the Test File

### Output

`tests/e2e/features/<kebab-feature-name>.e2e-spec.ts`

### Template

`.github/skills/lambda-generate-feature-tests/templates/feature.e2e-spec.ts`

### Code style

Same as `lambda-generate-api-tests` plus:

- `const app = getApiTestApp()` + `beforeAll/afterAll` with `app.bootstrap({ logGroupArns })` / `app.terminate()` (timeout `30000`)
- `app.requester.sendGraphQL(QUERY, variables)` for each step
- `app.requester.sendRest('METHOD', '/path', body)` for REST steps (mixed flows allowed)
- `// Step N: <Name> using state from Step N-1`
- `// Flow cannot continue — <reason>` on E tests
- **DB assertions** — **Required** when any step reads/writes DB — use at end of **S01** (and **ST01** for multi-step). Pattern: complete flow via API → `app.db.client.<model>.findUnique(...)` → assert final state matches. Requires `DATABASE_URL` in `envs/.env.e2e`.

---

## Step 6 — Verify Output & Report

| Check           | Pass when                          |
| --------------- | ---------------------------------- |
| Test file       | Created at expected path           |
| Output contract | Matches `manifest.yaml` → `output` |

1. Output path
2. Test count per aspect
3. Assumptions (missing API specs, inferred GraphQL shapes)
4. TODOs (env, auth, test data)

Suggest `manifest.yaml` → `next_skill` when complete.
