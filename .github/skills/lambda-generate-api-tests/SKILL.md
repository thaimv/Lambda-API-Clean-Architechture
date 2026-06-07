---
name: lambda-generate-api-tests
description: >
  Read an API detail design from document/detail-designs/ and generate a Vitest E2E
  test file (GraphQL or REST). Use when asked to "generate api tests", "create api test
  for <API>", "write e2e tests for <endpoint>", or "generate api test cases".
argument-hint: 'Path or name of the API detail design (e.g. createUserInfo or document/detail-designs/graphql/user/createUserInfo.md)'
---

# lambda-generate-api-tests

Generate a Vitest E2E test file for one GraphQL operation or REST endpoint.

## Input

```
/lambda-generate-api-tests {path-or-name}
```

## Goal

Read an API detail design → generate a complete, runnable Vitest E2E test file
that exercises the deployed endpoint using the `getApiTestApp()` helper.

## Rules to Load

- `.github/rules/e2e-testing-aspects.md`
- `.github/rules/e2e-testing-best-practices.md`
- `.github/rules/testing-strategy.md`

## Safety

- Stop and ask if any RESULT_CODE or request field is ambiguous.
- Never invent validation rules not stated in the design.

## DB verification (mandatory when applicable)

If the API reads from or writes to the database, generated tests **must** assert DB state via
`app.db.client` — not API response alone. See workflow Step 3 (Database side effects) and Step 6
(DB assertions rule).

## Authorization (A aspect)

Only when the design marks the endpoint as protected (e.g. `EB-001`). Actual behavior depends on **API type and gateway**, not a single pattern:

| API                      | Typical `app.withoutAuth()` outcome         | Assert                                                                                                  |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| GraphQL (AppSync + IAM)  | `UnauthorizedException` before Lambda runs  | `expectUnauthorizedGraphQL()` from `~/e2e/helpers/common` — accepts `EB-001` or `UnauthorizedException` |
| REST (API Gateway + IAM) | Non-200 `statusCode` (often 403) at gateway | `expect(result.statusCode).not.toBe(200)` — not body `EB-001` unless Lambda actually ran                |

Design doc `EB-001` applies when the **handler** rejects missing identity. IAM at AppSync/API Gateway may block earlier. See Aspect A in `.github/rules/e2e-testing-aspects.md`.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
