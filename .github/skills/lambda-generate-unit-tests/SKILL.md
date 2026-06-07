---
name: lambda-generate-unit-tests
description: >
  Read a module's source files and generate Vitest unit tests for all layers
  (GraphQL controller, REST controller, use case, repository, DTO).
  Use when asked to "generate unit tests for <module>", "write tests for <module>",
  "add unit tests to <module>", or "generate unit tests".
argument-hint: 'Module name or path (e.g. user or src/modules/user/)'
---

# lambda-generate-unit-tests

Generate Vitest unit tests for all layers of a LambdaAPI module.

## Input

```
/lambda-generate-unit-tests {module-name-or-path}
```

## Goal

Read source files of a module → generate complete, runnable Vitest unit test files
covering controller, use-case, repository, and DTO layers.

Run after `lambda-graphql-impl` or `lambda-rest-impl` (see `manifest.yaml` → `prev_skill`). Recommended after `lambda-spec-review` passes.

## Rules to Load

- `.github/rules/testing-strategy.md`

## Safety

- Skip files that already have corresponding test files (report them).
- Never modify source files — generate test files only.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
