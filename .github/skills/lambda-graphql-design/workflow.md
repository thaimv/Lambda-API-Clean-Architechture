# GraphQL API Detail Design Workflow

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Determine input form:
   - **File path** → read the spec at that path.
   - **Free-text description** → use as the requirement source.
3. If file path: confirm the file exists and is readable.
4. Extract: API name, operation type (Query/Mutation), input fields + validation rules, response shape, error cases, business rules.
5. If any required information is ambiguous or missing → **stop and ask** before generating.

---

## Step 2 — Load References

1. Read `document/detail-designs/_template.md` — follow its structure exactly.
2. Use **GraphQL sections only** — skip REST sections marked `<!-- REST -->`.
3. Reference example: `document/detail-designs/graphql/user/createUserInfo.md`.
4. Planned output path: `document/detail-designs/graphql/[module]/[api-name].md`.
5. Only include error subsections that apply — remove the rest.
6. Omit template metadata blocks from output.

---

## Step 3 — Generate Detail Design

1. Write the complete detail design markdown following the template structure.
2. Document only errors relevant to this API (see Error code reference below).
3. Output **exactly one** `.md` document — no preamble, no code-fence wrapper around the whole file.

### GraphQL Schema

- Use AppSync scalar types: `AWSDateTime`, `AWSDate`, `AWSJSON`, `AWSURL`.
- All new types MUST be added to `src/presenter/graphql/schema.graphql`.
- New Query entries in `type Query { }`, mutations in `type Mutation { }`.
- Mark non-nullable fields with `!`.
- Prefer `input` types for all mutation arguments.

### Authentication

- Cognito via AppSync. `cognitoSub` (userId) from `context.identity.sub`, `username` from `context.identity.username`.
- Unauthorized → `UnauthorizedError`.

### RouteName

- Every new field MUST have an entry in `src/common/constants/graphql-api.const.ts` → `RouteName`.

---

## Step 4 — Verify Output

| Check              | Pass when                                                 |
| ------------------ | --------------------------------------------------------- |
| Single file        | Exactly one markdown document produced                    |
| Output path        | `document/detail-designs/graphql/[module]/[api-name].md`  |
| Template structure | All required GraphQL sections from `_template.md` present |
| Request/response   | Shapes and validation rules documented                    |
| Error codes        | Only applicable codes from `response.const.ts`            |
| Output contract    | Matches `manifest.yaml` → `output`                        |

Report the output path to the user. Suggest `manifest.yaml` → `next_skill` when complete.

---

## Appendix — Error code reference

Source of truth: `src/common/constants/response.const.ts` → `RESULT_CODE`.

| Code     | HTTP | Description                                | Error class           |
| -------- | ---- | ------------------------------------------ | --------------------- |
| `SC-001` | 200  | Success                                    | —                     |
| `ES-001` | 500  | Unexpected server error                    | `InternalServerError` |
| `EB-001` | 401  | Unauthorized                               | `UnauthorizedError`   |
| `EB-002` | 400  | Bad request (business rule)                | `BadRequestError`     |
| `EB-003` | 404  | Resource not found                         | `NotFoundError`       |
| `EB-004` | 400  | Validation error (Zod / `@ValidationArgs`) | `ValidationError`     |
| `EB-009` | 400  | Resource already exists                    | `ExistedError`        |

> Only document errors relevant to the API.
