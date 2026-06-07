# Spec Compliance Review Workflow

## Reference Files

| File                                                | Purpose                          |
| --------------------------------------------------- | -------------------------------- |
| `./templates/pbi-spec.md`                           | Spec section layout              |
| `./templates/compliance-report.md`                  | Report output format             |
| `document/detail-designs/graphql/<module>/<api>.md` | Supplementary — when present     |
| `document/detail-designs/rest/<module>/<api>.md`    | Supplementary — when present     |
| `src/modules/<module>/`                             | Implementation under review      |
| `.github/rules/architecture.md`                     | Layer boundaries and conventions |

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Confirm spec file path exists and is readable; confirm it matches `manifest.yaml` → `input`.
3. Confirm section **2. Requirement Description** is non-empty — if vague → **stop and ask**.
4. Parse optional `{module-name}` argument when spec lists multiple modules (section 3.1).
5. Run `/lambda-init` if `.github/brain/project-context.json` is missing or stale.
6. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.
7. Read `.github/brain/contexts/spec-review-context.md` — if prior review exists for same spec + module, show summary and ask if re-review.
8. If `prev_skill` is a list, confirm implementation exists from the matching path (`lambda-graphql-impl` → GraphQL controller/schema; `lambda-rest-impl` → REST controller/path constants).

---

## Step 2 — Parse Spec

1. Extract PBI title/ID, main objective (section 1), requirements (section 2), module folder(s) (section 3.1), API style / Lambda stack (section 3.3), constraints (section 4).
2. Resolve target module(s): one → use it; multiple + name arg → scope; multiple + no arg → review each sequentially.
3. Update `spec-review-context.md` with spec path, module name(s), status `PARSING`.

---

## Step 3 — Load Implementation

For each target `<module-name>`:

1. Confirm `src/modules/<module-name>/` exists — if missing → record ❌ and continue report.
2. Read: `controllers/` (`.graph.controller.ts` and/or `.rest.controller.ts`), `usecases/implement/`, `repos/implements/`, `dtos/requests/`, `*.const.ts`, `*.graph.module.ts` / `*.rest.module.ts`.
3. Read detail design under `document/detail-designs/graphql/` or `rest/` and `brain/modules/<module>.md` when present.
4. When GraphQL: also read `src/presenter/graphql/schema.graphql` and `src/common/constants/graphql-api.const.ts` → `RouteName`.
5. When REST: also read `src/common/constants/rest-api.const.ts` for path constants.

---

## Step 4 — Map Requirements to Code

For each requirement in spec section 2, assign verdict: ✅ | ⚠️ | ❌ | ❓

| Requirement type             | Check in                                             |
| ---------------------------- | ---------------------------------------------------- |
| GraphQL field / REST route   | controller, `schema.graphql` or `rest-api.const.ts`  |
| Input validation             | `dtos/requests/`, controller (`@ValidationArgs`/Zod) |
| Business logic               | `usecases/implement/*.uc.impl.ts`                    |
| Persistence / external calls | `repos/implements/*.repo.impl.ts`                    |
| Success / error responses    | controller, use case, `response.const`               |
| Auth / identity              | controller, router, use case                         |

Verify section 4 constraints against use case and repo code.

---

## Step 5 — Architecture Compliance

Check against `.github/rules/architecture.md`: thin controller, no HTTP/GraphQL types in use case, repository isolation, Zod at boundary, correct error codes.

---

## Step 6 — Verify Output

1. Produce report using `./templates/compliance-report.md`.
2. Include: requirement table, architecture summary, overall verdict (`COMPLIANT` | `COMPLIANT_WITH_WARNINGS` | `NON_COMPLIANT`), action items.
3. Every ❌/⚠️ cites spec text and code location.
4. Update `spec-review-context.md` with verdict and open gaps.

| Check           | Pass when                           |
| --------------- | ----------------------------------- |
| Report in chat  | English, complete, no file creation |
| Evidence        | All gaps have spec + code citations |
| Verdict         | Overall compliance status stated    |
| Context saved   | `spec-review-context.md` updated    |
| Output contract | Matches `manifest.yaml` → `output`  |

**Safety:** read-only — do not modify spec or source. Suggest `manifest.yaml` → `next_skill` when complete.
