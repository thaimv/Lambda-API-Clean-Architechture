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

Both forms accepted: file path OR free-text description.

## Goal

Generate a complete GraphQL API detail design markdown document following LambdaAPI conventions.

Output **EXACTLY one** `.md` document — no explanation, no triple-backtick fence, no preamble.

## Rules to Load

- `document/detail-designs/_template.md`
- `document/detail-designs/graphql/user/createUserInfo.md` (reference example)

## Safety

- Stop and ask if any design field is ambiguous or missing before generating.
- Never invent validation rules or business logic not stated in the spec.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
