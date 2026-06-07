# Spec Review Workflow

## Prerequisites

- Read `.github/brain/project-overview.md` for domain understanding.
- Read `./templates/pbi-spec.md` for spec format reference.
- Per listed module → read `.github/brain/modules/{ModuleName}.md`
- Per listed feature → read `.github/brain/features/{feature-name}.md`

## Output

Report in chat (English). No file creation, no PR comments.

---

## Step 0: Load State

Read `.github/brain/contexts/spec-review-context.md`. If prior review exists for same spec → show result, ask if re-review.

---

## Step 1: PARSE

1. Read spec file.
2. Validate structure AND content against `./templates/pbi-spec.md` — use the template as a checklist:
   - Are all 5 sections present and non-empty?
   - Does content follow the format/examples in each section?
   - Does it satisfy GOOD PRACTICES and avoid AVOID items?
3. Record all violations.
4. **Save context** — update `spec-review-context.md` with spec info + "PARSING" status.

---

## Step 2: LOAD CONTEXT

Brain docs = senior dev's high-level memory. Read BEFORE evaluating.

1. Read `project-overview.md`, `brain/modules/{Module}.md`, `brain/features/{feature}.md` per spec section 3.
2. Missing doc for existing feature → record as missing context (needs creation).
3. Missing doc for new feature → acceptable.

---

## Step 3: EVALUATE

7 criteria. Each gets: ✅ Pass | ⚠️ Warning | ❌ Fail.

### 3.1 Clarity

- Exactly 1 primary behavior change? Domain terms explained inline? Concise?

### 3.2 Terminology

Check each domain term:

1. In `project-overview.md` / brain docs → ✅
2. Spec provides inline explanation → ✅
3. Light `grep_search` to verify term exists in code → ✅ (recommend adding to brain). Not found → ❌

### 3.3 Scope

- Modules listed as domain module names (matching `src/modules/` folder names)?
- Features reference `brain/features/`?
- Span > 3 modules or > 2 features → warn about splitting.

### 3.4 Completeness

- Requirements described as step-by-step behavior? Expected behavior clear?
- Obvious edge/error cases missing? API contract or DB changes documented?

### 3.5 Actionability

Spec is actionable when:

1. **What changes?** — delta clear
2. **Where to look?** — module + feature area identified
3. **What's the logic?** — new flow/condition/rule understandable

References must be accessible (no external URLs without content).

### 3.6 Granularity

- > 5 independent requirements → suggest splitting PBIs.
- > 3 modules → suggest splitting by module.
- Mix of API + UI + business logic → suggest splitting by layer.

### 3.7 Context Sufficiency

- Feature brain doc exists and covers the changing area → ✅
- Feature brain doc exists but misses related area → ⚠️ needs update
- Feature brain doc missing for existing feature → ⚠️ recommend creating before dev
- New feature (no baseline needed) → ✅

---

## Step 4: REPORT

Output in chat (English). Format:

```
## 📋 Spec Review: {PBI Title}
### Summary
### Evaluation Results (table: Criterion | Verdict | Notes)
### Details to Address (grouped by criterion)
### Unclear Terms (table, if any)
### Split Suggestions (if Granularity ⚠️/❌)
### Feature Docs Needed (if Context Sufficiency ⚠️/❌)
```

---

## Save Context

After report, update `.github/brain/contexts/spec-review-context.md`.

---

## Safety

- **Do not modify the spec** — report only.
- **Do not assume** — unclear term → say so, don't guess.
- **Brain docs first** — light code search only if brain docs don't cover a term.
- **Stay at design level** — do not deep-trace code logic.
