# REST API Detail Design Workflow

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Determine input form:
   - **File path** → read the spec at that path.
   - **Free-text description** → use as the requirement source.
3. If file path: confirm the file exists and is readable.
4. Extract: endpoint URL, HTTP method, path/query/body params + validation rules, response shape, error cases, business rules.
5. If any required information is ambiguous or missing → **stop and ask** before generating.

---

## Step 2 — Load References

1. Read `document/detail-designs/_template.md` — follow its structure exactly.
2. Use **REST sections only** — skip GraphQL sections marked `<!-- GraphQL -->`.
3. Reference example: `document/detail-designs/rest/user/Get Current User.md`.
4. Planned output path: `document/detail-designs/rest/[module]/[api-name].md`.
5. Only include error subsections that apply — remove the rest.
6. Omit template metadata blocks from output.

---

## Step 3 — Generate Detail Design

1. Write the complete detail design markdown following the template structure.
2. Document only errors relevant to this API (see Error code reference below).
3. Output **exactly one** `.md` document — no preamble, no code-fence wrapper around the whole file.

---

## Step 4 — Verify Output

| Check              | Pass when                                              |
| ------------------ | ------------------------------------------------------ |
| Single file        | Exactly one markdown document produced                 |
| Output path        | `document/detail-designs/rest/[module]/[api-name].md`  |
| Template structure | All required REST sections from `_template.md` present |
| Request/response   | Shapes and validation rules documented                 |
| Error codes        | Only applicable codes from `response.const.ts`         |
| Output contract    | Matches `manifest.yaml` → `output`                     |

Report the output path to the user. Suggest `manifest.yaml` → `next_skill` when complete.

---

## Appendix — Error code reference

Source of truth: `src/common/constants/response.const.ts` → `RESULT_CODE`.

| Code     | HTTP | Description                 | Error class           |
| -------- | ---- | --------------------------- | --------------------- |
| `SC-001` | 200  | Success                     | —                     |
| `ES-001` | 500  | Unexpected server error     | `InternalServerError` |
| `EB-001` | 401  | Unauthorized                | `UnauthorizedError`   |
| `EB-002` | 400  | Bad request (business rule) | `BadRequestError`     |
| `EB-003` | 404  | Resource not found          | `NotFoundError`       |
| `EB-004` | 400  | Validation error (Zod)      | `ValidationError`     |
| `EB-009` | 400  | Resource already exists     | `ExistedError`        |

> Only document errors relevant to the API.
