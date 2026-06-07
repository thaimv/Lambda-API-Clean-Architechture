---
applyTo: '**'
description: 'Constitution — absolute rules every agent interaction must follow. Skills provide workflows; rules provide domain knowledge.'
---

# LambdaAPI — Copilot Instructions

Base/template backend for AWS Lambda APIs. Node.js · TypeScript · AWS Lambda · Prisma (Aurora PostgreSQL) · DynamoDB (scaffolding) · REST + GraphQL (AppSync) · Clean Architecture. Ships infrastructure + one example `user` module.

## .github Structure

```
.github/
├── copilot-instructions.md      # This file — constitution (always loaded by Copilot)
├── cursor-instructions.md       # Cursor entry point (Agent / Chat)
├── brain/                       # Project knowledge (mental model)
│   ├── project-overview.md      # Project intro (system, users, domain terms)
│   ├── project-context.json     # Structured project facts (modules, deps, commands)
│   ├── modules/                 # Per-module docs (components, DI, deps)
│   ├── features/                # Per-feature flow docs (happy path, modules)
│   └── contexts/                # Runtime state per workflow (gitignored)
├── skills/                      # SKILL.md-based workflows (auto-discovered by Copilot)
│   ├── lambda-pr-review/        # PR/MR review workflow (GitHub / GitLab / ADO)
│   ├── lambda-spec-review/      # Spec compliance — code vs PBI spec
│   ├── lambda-init/             # Project init/verify workflow
│   ├── lambda-graphql-design/   # Generate GraphQL API detail design doc
│   ├── lambda-graphql-impl/     # Implement GraphQL API from design doc
│   ├── lambda-rest-design/      # Generate REST API detail design doc
│   ├── lambda-rest-impl/        # Implement REST API from design doc
│   ├── lambda-generate-api-tests/   # Generate E2E tests from detail design
│   ├── lambda-generate-feature-tests/ # Generate E2E tests from feature spec
│   └── lambda-generate-unit-tests/  # Generate unit tests for a domain module
├── rules/                       # Prescriptive rules (coding standards, architecture)
│   ├── architecture.md
│   ├── typescript-coding-standards.md
│   ├── testing-strategy.md
│   ├── e2e-e2e-testing-aspects.md  # E2E aspect catalog (S, E, B, …)
│   └── e2e-e2e-testing-best-practices.md  # E2E test writing standards
└── mcp/                         # MCP tool references (platform-aware)
    ├── README.md                # Platform detection (GitHub / GitLab / Azure DevOps)
    ├── github-tools-reference.md
    ├── gitlab-tools-reference.md
    └── ado-tools-reference.md
```

**Flow**: skill invoked → read `manifest.yaml` + `SKILL.md` → read `workflow.md` → load rules/brain → execute steps → verify output per manifest.

**Cursor**: Skills auto-discover from `.cursor/skills/` (symlinks to `.github/skills/`). No slash commands — see `cursor-instructions.md`.

## Agent Rules

### Language

- User-facing: **English**
- Code / comments / brain files: **English**

### Safety

- Checkpoint before any ADO write (PR comments, WI updates)
- Checkpoint before git push / PR creation
- Never merge, abandon, or auto-approve PRs
- Never auto-vote on PRs — only recommend
- Never run destructive operations (drop DB, delete S3 objects) without confirmation

### Constraints

- Verify before stating — no assumptions
- No whitespace-only changes
- Follow existing codebase patterns
- File-by-file edits with complete implementations

## Core Principles

These are **absolute and non-negotiable**:

1. **Clean Architecture**: Request flows Presenter → Controller → UseCase → Repository → DataSource. Each layer depends only on inner layers.
2. **Module isolation**: Each domain module in `src/modules/` owns its own controllers, use cases, repos, and dtos. No cross-module direct imports — share via `src/common/`.
3. **DI via InversifyJS + `@Module`**: Providers/controllers declared in `@Module` decorators, bootstrapped by `bootstrapApplication` in `src/config/di/di.config.ts`. Tokens are `Symbol.for(...)` in `common/constants/di.const.ts` and `{module}.const.ts`. Constructor injection via `@inject`.
4. **Lambdas as thin presenters**: Handlers in `src/presenter/lambdas/` only bootstrap the module + router and delegate. No business logic.
5. **Prisma = Aurora PostgreSQL (relational), DynamoDB = event/log/ranking data**. Datasources live in `src/common/datasources/`. Use the right DB for the right data type.
6. **Validation at the boundary**: Validate input with Zod at the controller (`@ValidationArgs`) / router boundary. Inner layers trust validated data.
7. **Every new endpoint needs tests**: unit tests (under `tests/unit-test/`) for use cases + repositories, e2e for the full Lambda handler.

> For detailed architecture rules → see `rules/architecture.md`
> For coding conventions, naming, patterns → see `rules/typescript-coding-standards.md`

## Navigation

| What                                           | Where                                   |
| ---------------------------------------------- | --------------------------------------- |
| Project overview (system, users, domain terms) | `brain/project-overview.md`             |
| Project facts (modules, deps, commands, stack) | `brain/project-context.json`            |
| Architecture & module rules                    | `rules/architecture.md`                 |
| TypeScript coding standards & patterns         | `rules/typescript-coding-standards.md`  |
| Testing conventions                            | `rules/testing-strategy.md`             |
| MCP platform detection                         | `mcp/README.md`                         |
| GitHub MCP tool reference                      | `mcp/github-tools-reference.md`         |
| GitLab MCP tool reference                      | `mcp/gitlab-tools-reference.md`         |
| Azure DevOps MCP tool reference                | `mcp/ado-tools-reference.md`            |
| Per-module docs (use cases, repos, DI)         | `brain/modules/{ModuleName}.md`         |
| Feature business flows                         | `brain/features/{feature-name}.md`      |
| PR review workflow                             | `skills/lambda-pr-review/`              |
| Spec compliance workflow                       | `skills/lambda-spec-review/`            |
| Init/verify workflow                           | `skills/lambda-init/`                   |
| GraphQL API design doc generator               | `skills/lambda-graphql-design/`         |
| GraphQL API implementation guide               | `skills/lambda-graphql-impl/`           |
| REST API design doc generator                  | `skills/lambda-rest-design/`            |
| REST API implementation guide                  | `skills/lambda-rest-impl/`              |
| E2E tests from API detail design               | `skills/lambda-generate-api-tests/`     |
| E2E tests from feature spec                    | `skills/lambda-generate-feature-tests/` |
| Unit tests for a domain module                 | `skills/lambda-generate-unit-tests/`    |
| E2E aspect catalog                             | `rules/e2e-testing-aspects.md`          |
| E2E test writing standards                     | `rules/e2e-testing-best-practices.md`   |

## AI Navigation Tips

- Read `project-context.json` before broad search.
- When reviewing/developing a module, load its `brain/modules/{module-name}.md` for context. `user.md` is the reference example to copy.
- Routing: `src/config/routes/rest-api-router.ts` (`RestApiRouter`) and `graph-ql-router.ts` (`GraphQLRouter`).
- DI: bindings come from `@Module` decorators; the container + `bootstrapApplication` are in `src/config/di/di.config.ts`. Shared tokens in `src/common/constants/di.const.ts`; datasource DI modules in `src/config/di/datasources/`.
- Lambda entry points: `src/presenter/lambdas/public-api.ts`, `auth-api.ts`, and `appsync-api.ts`. Composition modules in `src/modules/*.module.ts`.
- Datasources (Prisma, DynamoDB, S3, ...), shared utils, errors, response helpers → `src/common/`.

## MCP

PR/MR/issue operations are platform-aware — detect the host from `git remote get-url origin`:

- **github**: GitHub MCP server — repo/PR/issue operations. See `mcp/github-tools-reference.md`. (This repo uses GitHub: `.github/workflows/` + GitHub Copilot CLI.)
- **gitlab**: GitLab MCP server — repo/MR/issue operations. See `mcp/gitlab-tools-reference.md`.
- **azure-devops**: `npx @azure-devops/mcp {org}` — ADO project/repo/PR/WI operations. See `mcp/ado-tools-reference.md`.
- Platform detection: `mcp/README.md`
