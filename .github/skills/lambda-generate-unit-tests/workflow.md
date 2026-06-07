# lambda-generate-unit-tests Workflow

## Reference Files

| File                                  | Read at | Purpose                                     |
| ------------------------------------- | ------- | ------------------------------------------- |
| `.github/rules/testing-strategy.md`   | Step 4  | Test placement, mock pattern                |
| `tests/common/helpers/test.helper.ts` | Step 3  | `TestHelper.createTestingModule()`          |
| Controller source                     | Step 3  | Method signatures, DI token, use-case calls |
| Use-case source                       | Step 3  | Business logic, repo calls, error throws    |
| Repo source                           | Step 3  | Prisma model/table, query shape             |
| DTO source                            | Step 3  | Zod schema rules                            |

## Prerequisites

- Module exists under `src/modules/<module>/`.
- `tests/common/helpers/test.helper.ts` exists.

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse `{module-name-or-path}` — must resolve to a folder under `src/modules/`; confirm it matches `manifest.yaml` → `input`.
3. Confirm `src/modules/<module>/` exists — if missing → **stop and ask**.
4. If `prev_skill` is a list, confirm the module was implemented via the matching path (GraphQL controllers / `lambda-graphql-impl`, or REST controllers / `lambda-rest-impl`).
5. Identify which layers exist: `controllers/`, `usecases/implement/`, `repos/implements/`, `dtos/requests/`.
6. List existing tests under `tests/unit-test/modules/<module>/` — report files that will be **skipped**.
7. If `manifest.yaml` → `templates` is not `none`, load files under `templates/`.

---

## Step 2 — Read Source Files

1. `controllers/<name>.graph.controller.ts` (if exists)
2. `controllers/<name>.rest.controller.ts` (if exists)
3. `usecases/implement/<name>.uc.impl.ts`
4. `repos/implements/<name>.repo.impl.ts` (if exists)
5. `dtos/requests/<name>.request.dto.ts` (if exists)
6. `<module>.const.ts` — for DI tokens
7. Existing stubs under `tests/unit-test/modules/<module>/stubs/`

---

## Step 3 — Plan Tests Per Layer

### GraphQL / REST Controller

- **S**: Valid request → use case called with correct args → response returned
- **E**: Use case throws domain error → controller re-throws unchanged

### Use Case

- **S**: Valid DTO + repo returns data → correct result returned
- **E**: Repo returns `null` → `NotFoundError` (if applicable)
- **E**: Nickname/resource conflict → `ExistedError` (if applicable)
- **E**: Repo throws unexpected error → propagates
- **Branch**: Each distinct `if/else` branch in the use case

### Repository

- **S**: Valid input → correct Prisma `where`/`data` shape + mapped result
- **E**: DB throws → propagates

### DTO (only when Zod schema has non-trivial rules)

- **S**: Valid input → `success: true`, trimmed values preserved
- **E**: Empty/missing required field → `success: false`

---

## Step 4 — Generate Test Files

### Output paths

```
tests/unit-test/modules/<module>/controllers/<name>.graph.controller.test.ts
tests/unit-test/modules/<module>/controllers/<name>.rest.controller.test.ts
tests/unit-test/modules/<module>/usecases/<name>.uc.impl.test.ts
tests/unit-test/modules/<module>/repos/<name>.repo.impl.test.ts
tests/unit-test/modules/<module>/dtos/requests/<name>.request.dto.test.ts
tests/unit-test/modules/<module>/stubs/<name>.stub.ts
```

### Templates

| Layer              | Template                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| GraphQL controller | `.github/skills/lambda-generate-unit-tests/templates/graph-controller.test.ts` |
| REST controller    | `.github/skills/lambda-generate-unit-tests/templates/rest-controller.test.ts`  |
| Use case           | `.github/skills/lambda-generate-unit-tests/templates/usecase.test.ts`          |
| Repository         | `.github/skills/lambda-generate-unit-tests/templates/repo.test.ts`             |
| DTO                | `.github/skills/lambda-generate-unit-tests/templates/dto.test.ts`              |

### Code style

| Rule         | Detail                                                                     |
| ------------ | -------------------------------------------------------------------------- |
| DI container | `TestHelper.createTestingModule([...])` — always use, never `new` directly |
| Mocking      | `vi.spyOn(instance, 'method').mockResolvedValue(...)`                      |
| Reset        | `afterEach(() => { vi.restoreAllMocks(); })`                               |
| Stubs        | Factory functions in `stubs/<name>.stub.ts`                                |
| Imports      | `reflect-metadata` first                                                   |
| `TAuthUser`  | `{ userId: 'uuid', username: 'testuser' }`                                 |

---

## Step 5 — Verify

After writing all test files, run and confirm:

```bash
# Run only the newly generated test files
npx vitest run tests/unit-test/modules/<module>/

# Run with coverage for the module
npx vitest run --coverage --coverage.include="src/modules/<module>/**" tests/unit-test/modules/<module>/
```

### Pass criteria

| Check                | Requirement                                                  |
| -------------------- | ------------------------------------------------------------ |
| All tests green      | Zero failing tests — fix any red tests before reporting done |
| UseCase coverage     | ≥ 100% lines                                                 |
| Repository coverage  | ≥ 80% lines                                                  |
| No `any` type errors | TypeScript must compile without errors in test files         |
| Output contract      | Matches `manifest.yaml` → `output`                           |

If a test fails:

1. Re-read the source file — the implementation may differ from the template assumption.
2. Fix the test (not the source) to match actual behaviour.
3. Re-run until green.

---

## Step 6 — Report

1. List generated files
2. Test count per layer
3. Coverage summary per layer (lines %)
4. Skipped files (already tested)
5. Stubs created
6. TODOs

Suggest `manifest.yaml` → `next_skill` when complete.
