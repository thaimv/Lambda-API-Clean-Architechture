---
name: lambda-rest-impl
description: 'Implement a REST API (API Gateway + Lambda) from a detail design document. Use when: user asks to implement/code a REST endpoint from a design spec.'
argument-hint: 'Path to the detail design document (e.g. docs/get-user.md)'
---

# REST API Implementation

## Input

```
/lambda-rest-impl {path-to-detail-design.md}
```

## Goal

Read the detail design document → generate complete, runnable REST API code (TypeScript)
following LambdaAPI's Clean Architecture and conventions.

The design document is the **single source of truth**. Do not invent business rules outside it.

## Rules to Load

- `.github/rules/architecture.md`
- `.github/rules/typescript-coding-standards.md`
- `.github/rules/testing-strategy.md`

## Safety

- Stop and ask if any design field is ambiguous before writing code.
- Never invent validation rules not stated in the design.
- Do not modify existing unrelated code or providers.

## Workflow

Read [manifest.yaml](./manifest.yaml) at workflow Step 1 for the skill contract (`input`, `output`, `templates`, `prev_skill`, `next_skill`).

Follow [workflow.md](./workflow.md) step by step.
