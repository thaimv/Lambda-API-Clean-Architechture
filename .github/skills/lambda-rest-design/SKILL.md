---
name: lambda-rest-design
description: 'Generate a REST API detail design document for LambdaAPI. Use when: user asks to write or document a REST endpoint design spec.'
argument-hint: 'Path to PBI spec file OR brief description (e.g. specs/pbi-123.md or "GET /user to fetch current user profile")'
---

# REST API Detail Design

## Input

```
/lambda-rest-design {path-to-spec.md}
/lambda-rest-design {description of the endpoint}
```

Both forms are accepted:

- **File path** (e.g. `specs/pbi-123.md`) — read the spec file first, extract API requirements, then generate the design doc.
- **Free-text description** — use the description directly as the source of truth.

## Pre-process: if input is a file path

1. Read the spec file at the given path.
2. Extract: endpoint URL, HTTP method, path/query/body params + validation rules, expected response shape, error cases, and any business rules.
3. Use extracted information as the source of truth for generating the document below.
4. If any required information is ambiguous or missing in the spec, **stop and ask** before generating.

## Goal

Generate a complete REST API detail design markdown document following LambdaAPI conventions.

Output **EXACTLY one** markdown (`.md`) document — no explanation before or after.
Do NOT wrap the output in triple-backtick fences.
Do NOT say "Here is your file" or similar. Output only document content.

## Document structure

1. Read `document/detail-designs/_template.md` — follow its structure and section order exactly.
2. Use **REST sections only** — skip GraphQL sections marked with `<!-- GraphQL -->` comments.
3. Reference example: `document/detail-designs/rest/users/Get Current User.md`.
4. Output path: `document/detail-designs/rest/[module]/[api-name].md`.
5. Only include error subsections that apply to this API — remove the rest.
6. Omit template metadata blocks (`> Generated from spec`, `> Next step`, `> Tip`) from output.

---

## Error code reference

Source of truth: `src/common/constants/response.const.ts` → `RESULT_CODE`.

Use `RESULT_CODE` and `ERROR_MESSAGE` constants — do not hardcode codes in implementation.

| Code     | HTTP | Category | Description                 | Error class                |
| -------- | ---- | -------- | --------------------------- | -------------------------- |
| `SC-001` | 200  | Success  | Success                     | —                          |
| `ES-001` | 500  | System   | Unexpected server error     | `InternalServerError`      |
| `ES-002` | 404  | System   | Secrets not found           | `SecretsNotFoundError`     |
| `ES-003` | 404  | System   | Database URL not found      | `DatabaseUrlNotFoundError` |
| `EB-001` | 401  | Business | Unauthorized                | `UnauthorizedError`        |
| `EB-002` | 400  | Business | Bad request (business rule) | `BadRequestError`          |
| `EB-003` | 404  | Business | Resource not found          | `NotFoundError`            |
| `EB-004` | 400  | Business | Validation error (Zod)      | `ValidationError`          |
| `EB-009` | 400  | Business | Resource already exists     | `ExistedError`             |

> In design docs, only document errors relevant to the API. `ES-002` / `ES-003` are infrastructure errors — include only when the API directly depends on secrets or DB config.
