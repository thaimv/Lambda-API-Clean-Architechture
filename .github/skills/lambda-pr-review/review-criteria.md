# Code Review Criteria

## Severity Levels

| Level | Label    | Meaning               | PR Impact             |
| ----- | -------- | --------------------- | --------------------- |
| 🔴    | CRITICAL | Must fix before merge | REQUEST_CHANGES       |
| 🟠    | HIGH     | Should fix            | APPROVE_WITH_COMMENTS |
| 🟡    | MEDIUM   | Recommended           | APPROVE_WITH_COMMENTS |
| 🟢    | LOW      | Nice to have          | APPROVE               |

## Finding Categories

Use **exactly one** category per finding (marker de-duplication key). Each check below belongs to one category — use that category in the marker `<!-- copilot-review: {filePath}:{startLine}:{category} -->`.

When two categories seem to fit, pick the **most specific**:

- Layer placement / who may call whom → `LAYERING`
- Module boundaries, datastore choice, dependency direction → `ARCHITECTURE`
- `@ValidationArgs`, Zod schemas, DTO shape → `VALIDATION`

| Category          | Scope                                                               |
| ----------------- | ------------------------------------------------------------------- |
| `ARCHITECTURE`    | Clean Architecture direction, module isolation, datastore selection |
| `LAYERING`        | Thin presenters/controllers; use case / repo responsibilities       |
| `VALIDATION`      | Boundary validation, Zod, DTO location                              |
| `SECURITY`        | Secrets, injection, unsafe input, PII in logs                       |
| `ERROR_HANDLING`  | Error classes, response constants, status mapping                   |
| `DI`              | Inversify decorators, tokens, `@Module` bindings                    |
| `TESTING`         | Unit/E2E coverage, mocks, test layout                               |
| `NAMING`          | File suffixes, class/interface naming                               |
| `TYPES`           | `any`, return types, strict mode                                    |
| `MAINTAINABILITY` | SOLID, duplication, imports, style                                  |
| `DOCUMENTATION`   | JSDoc on public interfaces                                          |

---

## Checks by Category

Severity tag on each line: 🔴 CRITICAL · 🟠 HIGH · 🟡 MEDIUM · 🟢 LOW

### `ARCHITECTURE`

- [ ] 🔴 Clean Architecture layer direction respected (Presenter → Controller → UseCase → Repository → DataSource)
- [ ] 🔴 No cross-module direct imports (share via `src/common/` or injected interfaces)
- [ ] 🟠 Repository interface updated when a new repo method is added
- [ ] 🟠 Correct datastore for data type (relational → Prisma/Aurora; events/logs → DynamoDB; files → S3)

### `LAYERING`

- [ ] 🔴 No business logic in Lambda handler or controller (no DB calls, no data-value branching)
- [ ] 🔴 UseCases depend on Repository **interfaces** only — no concrete repo/datasource classes
- [ ] 🔴 Controllers do not call repositories or datasources directly
- [ ] 🟠 Controller/route or GraphQL resolver registration updated for new endpoints

### `VALIDATION`

- [ ] 🔴 Zod validation at controller boundary (`@ValidationArgs`) — no raw `event.body` passed to use cases
- [ ] 🟡 Request schemas co-located in `dtos/requests/` with exported inferred types

### `SECURITY`

- [ ] 🔴 No security vulnerabilities (SQL injection, exposed secrets, unvalidated input, secrets in code)
- [ ] 🔴 No direct user input passed to shell commands
- [ ] 🔴 PII or sensitive data not logged

### `ERROR_HANDLING`

- [ ] 🔴 Custom error classes from `src/common/errors/` — no raw `new Error()` from use cases
- [ ] 🟠 User-facing messages use `ERROR_MESSAGE` / `RESULT_CODE` from `response.const.ts` — not hardcoded strings
- [ ] 🟡 Errors mapped to appropriate HTTP/GraphQL status at the presenter boundary
- [ ] 🟡 Repository wraps DB errors into domain errors — no raw DB errors in responses

### `DI`

- [ ] 🔴 New injectable classes decorated with `@injectable()` and registered in the relevant `@Module` `providers`
- [ ] 🟠 Constructor injection via `@inject` — no property injection
- [ ] 🟠 DI tokens (`Symbol.for`) in `common/constants/di.const.ts` or `{module}.const.ts`, bound in `@Module`

### `TESTING`

- [ ] 🟠 Unit tests for new/changed use case logic (target: 100% for new UseCase)
- [ ] 🟡 E2E test for new Lambda routes (target: ≥ 80% handler coverage via E2E)
- [ ] 🟡 Unit tests mirror `src/` under `tests/unit-test/`; mocks via constructor injection (`vi.fn()`)
- [ ] 🟢 Additional edge-case or error-path tests

### `NAMING`

- [ ] 🟡 Naming conventions match standards (kebab-case files, suffixes, `I`-prefixed interfaces)

### `TYPES`

- [ ] 🟡 No `any` without justification; explicit return types on `async` functions

### `MAINTAINABILITY`

- [ ] 🟠 SOLID principles followed in new/changed code
- [ ] 🟡 No unjustified duplication — extract shared code to `src/common/` when cross-cutting
- [ ] 🟡 ES module imports with `@/` alias; no `require()`; prefer `async/await` over `.then()`
- [ ] 🟢 Minor style/readability improvements

### `DOCUMENTATION`

- [ ] 🟢 JSDoc on public interfaces

---

## Decision & Vote Mapping

**Decision** (chat report) — use the highest severity among findings:

| Highest severity present | Decision                |
| ------------------------ | ----------------------- |
| CRITICAL                 | `REQUEST_CHANGES`       |
| HIGH or MEDIUM           | `APPROVE_WITH_COMMENTS` |
| LOW only or none         | `APPROVE`               |

**Recommended vote** (PR summary comment) — map from Decision:

| Decision                | Recommended vote          |
| ----------------------- | ------------------------- |
| `APPROVE`               | Approved                  |
| `APPROVE_WITH_COMMENTS` | Approved with suggestions |
| `REQUEST_CHANGES`       | Waiting for author        |

**Override** — Decision is `REQUEST_CHANGES` **and** 2+ CRITICAL findings with at least one `SECURITY` → recommend **Rejected** instead of Waiting for author.

> ⚠️ AI must NOT auto-vote. **Decision** → chat report (`review-report.md`); **Recommended vote** → PR summary (`review-comment.md`); Step 4 shows both when prompting manual vote.
