---
name: lambda-spec-review
description: 'Review PBI spec — validate clarity, completeness, AI-readiness. Use when: user asks to review a spec, validate spec, check PBI.'
argument-hint: 'Path to spec file (e.g., specs/pbi-12345.md)'
---

# PBI Spec Review

## Input

```
/lambda-spec-review {path-to-spec.md}
```

## Goal

Read PBI spec → load project context + feature docs → evaluate whether spec is clear enough for AI to implement → report gaps.

## Workflow

Follow [workflow.md](./workflow.md) step by step.
