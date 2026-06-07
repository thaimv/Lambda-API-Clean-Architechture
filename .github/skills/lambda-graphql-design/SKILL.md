---
name: lambda-graphql-design
description: 'Generate a GraphQL API detail design document for LambdaAPI. Use when: user asks to write or document a GraphQL query or mutation design spec.'
argument-hint: 'Path to PBI spec file OR brief description (e.g. specs/pbi-123.md or "createUserInfo mutation that upserts user profile")'
---

# GraphQL API Detail Design

## Input

```
/lambda-graphql-design {path-to-spec.md}
/lambda-graphql-design {description of the operation}
```

Both forms are accepted:

- **File path** (e.g. `specs/pbi-123.md`) — read the spec file first, extract API requirements, then generate the design doc.
- **Free-text description** — use the description directly as the source of truth.

## Pre-process: if input is a file path

1. Read the spec file at the given path.
2. Extract: API name, operation type (Query/Mutation), input fields + validation rules, expected response shape, error cases, and any business rules.
3. Use extracted information as the source of truth for generating the document below.
4. If any required information is ambiguous or missing in the spec, **stop and ask** before generating.

## Goal

Generate a complete GraphQL API detail design markdown document following LambdaAPI conventions.

Output **EXACTLY one** markdown (`.md`) document — no explanation before or after.
Do NOT wrap the output in triple-backtick fences.
Do NOT say "Here is your file" or similar. Output only document content.

## Document structure

1. Read `document/detail-designs/_template.md` — follow its structure and section order exactly.
2. Use **GraphQL sections only** — skip REST sections marked with `<!-- REST -->` comments.
3. Reference example: `document/detail-designs/graphql/users/createUserInfo.md`.
4. Output path: `document/detail-designs/graphql/[module]/[api-name].md`.
5. Only include error subsections that apply to this API — remove the rest.
6. Omit template metadata blocks (`> Generated from spec`, `> Next step`, `> Tip`) from output.

## Rules & Notes

### GraphQL Schema

- Use AppSync scalar types where appropriate: `AWSDateTime`, `AWSDate`, `AWSJSON`, `AWSURL`.
- All new GraphQL types MUST be added to `src/presenter/graphql/schema.graphql`.
- New Query entries go in `type Query { }`, mutations in `type Mutation { }`.
- Mark non-nullable fields with `!`. Use nullable only when the value may legitimately be absent.
- Prefer `input` types for all mutation arguments.

### Authentication

- Authentication handled by Cognito via AppSync.
- `gigyaUuid` (userId) extracted from `context.identity.cognitoIdentityAuthProvider`.
- `username` extracted from `context.identity.username`.
- Unauthorized requests throw `UnauthorizedError`.

### RouteName

- Every new GraphQL field MUST have an entry in `src/common/constants/graphql-api.const.ts` → `RouteName` enum.
- Query fields in `# ===== Query =====` section; mutations in `# ===== Mutation =====`.

### AppSync resolver

- Resolver at `src/presenter/graphql/resolvers/invoke-request.ts` is shared for ALL fields.
- It forwards `field`, `arguments`, `identity`, `source`, and `selectionSetList` to the Lambda.

### Error codes (GraphQL)

Source of truth: `src/common/constants/response.const.ts` → `RESULT_CODE`.

GraphQL errors use AppSync client format. Lambda returns `BaseError.toCustomError()` internally; AppSync resolver maps it via `util.error(message, code, data, code)` so the client sees `errorType` / `errorInfo` (both = `RESULT_CODE`).

```json
{
  "data": {
    "[fieldName]": null
  },
  "errors": [
    {
      "message": "[error message]",
      "errorType": "EB-004",
      "data": null,
      "errorInfo": "EB-004",
      "path": ["[fieldName]"],
      "locations": [
        {
          "line": 2,
          "column": 3,
          "sourceName": "GraphQL request"
        }
      ]
    }
  ]
}
```

| Code     | HTTP | Category | Description                                | Error class                |
| -------- | ---- | -------- | ------------------------------------------ | -------------------------- |
| `SC-001` | 200  | Success  | Success                                    | —                          |
| `ES-001` | 500  | System   | Unexpected server error                    | `InternalServerError`      |
| `ES-002` | 404  | System   | Secrets not found                          | `SecretsNotFoundError`     |
| `ES-003` | 404  | System   | Database URL not found                     | `DatabaseUrlNotFoundError` |
| `EB-001` | 401  | Business | Unauthorized                               | `UnauthorizedError`        |
| `EB-002` | 400  | Business | Bad request (business rule)                | `BadRequestError`          |
| `EB-003` | 404  | Business | Resource not found                         | `NotFoundError`            |
| `EB-004` | 400  | Business | Validation error (Zod / `@ValidationArgs`) | `ValidationError`          |
| `EB-009` | 400  | Business | Resource already exists                    | `ExistedError`             |

> In design docs, only document errors relevant to the API. `ES-002` / `ES-003` are infrastructure errors — include only when the API directly depends on secrets or DB config.
