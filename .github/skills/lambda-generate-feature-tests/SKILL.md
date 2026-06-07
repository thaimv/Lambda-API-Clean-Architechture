---
name: lambda-generate-feature-tests
description: >
  Read a feature spec and generate a Vitest E2E test file in tests/e2e/features/.
  Use when asked to "generate feature test cases", "create tests for a feature",
  "write feature e2e tests", or "generate feature tests for <feature>".
argument-hint: 'Feature name or spec path (e.g. user-profile-bootstrap or document/specs/user-profile-bootstrap/index.md)'
---

# lambda-generate-feature-tests

Generate a multi-step E2E test file for a business feature spanning one or more APIs.

## Input

```
/lambda-generate-feature-tests {feature-name-or-spec-path}
```

## Goal

Read a feature spec → generate a complete, runnable Vitest E2E test file at
`tests/e2e/features/<kebab-feature-name>.e2e-spec.ts` that chains multiple API calls
and asserts end-to-end correctness.

## Rules to Load

- `.github/rules/e2e-testing-aspects.md`
- `.github/rules/e2e-testing-best-practices.md`
- `.github/rules/testing-strategy.md`

## Safety

- Stop and ask if any step's API contract is missing or ambiguous.
- Never invent inter-step state not described in the spec.

## DB verification (mandatory when applicable)

If any step in the feature reads from or writes to the database, generated tests **must** assert DB state via
`app.db.client` — not API response alone. See workflow Step 3 (Database side effects) and Step 6
(DB assertions rule).

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
