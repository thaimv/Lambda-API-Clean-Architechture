---
name: lambda-graphql-impl
description: 'Implement a GraphQL API (AppSync + Lambda) from a detail design document. Use when: user asks to implement/code a GraphQL query or mutation from a design spec.'
argument-hint: 'Path to the detail design document (e.g. docs/create-user-info.md)'
---

# GraphQL API Implementation

## Input

```
/lambda-graphql-impl {path-to-detail-design.md}
```

## Goal

Read the detail design document → generate complete, runnable GraphQL API code (TypeScript)
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

Follow [workflow.md](./workflow.md) step by step.
