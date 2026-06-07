# .github — AI Agent Kit (Copilot + Cursor)

Configuration kit to help **GitHub Copilot** and **Cursor** understand and work effectively with the LambdaAPI project
(a base/template AWS Lambda backend with one example `user` module).

## Structure

```
.github/
├── AGENTS.md                 ← This file (AI kit overview)
├── copilot-instructions.md   ← Ground rules (Copilot — always loaded)
├── cursor-instructions.md    ← Cursor-specific guide (skills, conventions)
├── brain/                    ← Project memory
├── skills/                   ← Automated workflows
├── rules/                    ← Coding/architecture conventions
└── mcp/                      ← MCP tool references (platform-aware)

.cursor/
├── rules/
│   └── lambda-apis.mdc       ← Cursor always-on rules
└── skills/                   ← Symlinks → .github/skills/ (Cursor auto-discovery)
```

## Components

### copilot-instructions.md

Core instruction file — Copilot **always reads this file** on each interaction. It contains:

- Architecture principles (non-negotiable)
- Safety rules (no PR merge, no automatic push, etc.)
- Navigation map to other files

**Avoid** writing detailed workflows here. Keep it concise and link to relevant docs.

### brain/ — Project Memory

Project knowledge that helps AI **understand** context without opening code first.

| File/Folder            | Content                     | Example questions AI can answer                  |
| ---------------------- | --------------------------- | ------------------------------------------------ |
| `project-overview.md`  | Domain, users, glossary     | "Who is this API for?"                           |
| `project-context.json` | Modules, deps, commands     | "How many Lambda stacks does this project have?" |
| `modules/{Name}.md`    | Module use cases, repos, DI | "What use cases are in UserModule?"              |
| `features/{name}.md`   | High-level feature flow     | "How does create-user-info flow work?"           |
| `contexts/`            | Runtime workflow state      | (AI-managed, gitignored)                         |

**Writing guideline**: Explain like a senior dev briefing a newcomer in 1-2 minutes. This is not a spec.

### skills/ — Automated Workflows

Each folder contains `SKILL.md` (instructions), `manifest.yaml` (skill contract — **read at workflow Step 1**), and optionally `workflow.md`, `templates/`, and other supporting files.

| Skill                           | Invocation                                          | Description                                                         |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| `lambda-pr-review`              | `/lambda-pr-review {PR_ID}`                         | Review PRs/MRs from GitHub, GitLab, or Azure DevOps (auto-detected) |
| `lambda-spec-review`            | `/lambda-spec-review {spec-path} [{module-name}]`   | Verify implementation matches PBI spec                              |
| `lambda-init`                   | `/lambda-init`                                      | Initialize / validate project context                               |
| `lambda-graphql-design`         | `/lambda-graphql-design {spec.md or description}`   | Generate a GraphQL API detail design document                       |
| `lambda-graphql-impl`           | `/lambda-graphql-impl {design-doc-path}`            | Implement a GraphQL API from a detail design doc                    |
| `lambda-rest-design`            | `/lambda-rest-design {spec.md or description}`      | Generate a REST API detail design document                          |
| `lambda-rest-impl`              | `/lambda-rest-impl {design-doc-path}`               | Implement a REST API from a detail design doc                       |
| `lambda-generate-api-tests`     | `/lambda-generate-api-tests {detail-design-path}`   | Generate E2E tests for one GraphQL/REST API from detail design      |
| `lambda-generate-feature-tests` | `/lambda-generate-feature-tests {feature-spec}`     | Generate E2E feature tests from spec / brain feature doc            |
| `lambda-generate-unit-tests`    | `/lambda-generate-unit-tests {module-name-or-path}` | Generate Vitest unit tests for all layers of a domain module        |

Each skill can include `manifest.yaml`, `workflow.md`, `templates/`, and additional supporting files.

### rules/ — Shared Rules

Prescriptive coding and architecture rules used by multiple workflows.

| File                             | Content                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `architecture.md`                | Clean Architecture, module isolation, DI with InversifyJS |
| `typescript-coding-standards.md` | Naming, conventions, patterns                             |
| `testing-strategy.md`            | Test conventions, mock patterns (Vitest)                  |
| `e2e-testing-aspects.md`         | E2E aspect catalog (S, E, B, EP, ST, N, I, A)             |
| `e2e-testing-best-practices.md`  | E2E AAA, assertions, isolation, readability               |

**Do not put here**: module docs (→ `brain`), workflow steps (→ `skills`), MCP references (→ `mcp`).

### mcp/ — MCP Platform References

MCP tool references for PR/MR/issue operations. Platform is auto-detected from `git remote` — see `mcp/README.md`.

| File                        | Content                                             |
| --------------------------- | --------------------------------------------------- |
| `README.md`                 | Platform detection (GitHub / GitLab / Azure DevOps) |
| `github-tools-reference.md` | GitHub MCP usage guide (PR/issue tools)             |
| `gitlab-tools-reference.md` | GitLab MCP usage guide (MR/issue tools)             |
| `ado-tools-reference.md`    | Azure DevOps MCP usage guide                        |

### cursor-instructions.md

Cursor-specific entry point. Important: **Cursor does not use `/lambda-*` slash commands**. Skills must live under `.cursor/skills/` (symlinked from `.github/skills/`) so Cursor can auto-discover them via `SKILL.md` frontmatter.

### For Developers (Cursor)

1. Open the **repository root** as the Cursor workspace (the folder containing `package.json`, `.github/`, and `.cursor/`) — not a parent directory if the repo is nested in a monorepo.
2. Skills are symlinked: `.cursor/skills/` → `.github/skills/`. No slash commands — describe the task in Agent chat.
3. Example prompts:
   - _Initialize / verify project context_ → skill `lambda-init`
   - _Review PR #123_ → skill `lambda-pr-review`
   - _Implement createUserInfo from design doc_ → skill `lambda-graphql-impl`
   - _Generate E2E tests for createUserInfo_ → skill `lambda-generate-api-tests`
   - _Generate feature E2E tests_ → skill `lambda-generate-feature-tests`
   - _Generate unit tests for user module_ → skill `lambda-generate-unit-tests`
4. If the wrong workflow runs, say: _Follow the `lambda-graphql-impl` skill_.
5. MCP: connect GitHub / GitLab / ADO as needed — see `.github/mcp/README.md`.

## Usage

### For Developers (GitHub Copilot)

1. Open VS Code with Copilot Chat.
2. Run `/lambda-init` for first-time context initialization.
3. Run `/lambda-pr-review 12345` to review a PR.
4. Run `/lambda-spec-review document/specs/pbi-xxx.md` after implementation to verify code matches spec.
5. Run `/lambda-graphql-design specs/pbi-123.md` (or description) to generate a GraphQL design doc.
6. Run `/lambda-graphql-impl docs/create-user-info.md` to implement from a design doc.
7. Run `/lambda-rest-design specs/pbi-456.md` (or description) to generate a REST design doc.
8. Run `/lambda-rest-impl docs/get-user.md` to implement a REST endpoint from a design doc.
9. Run `/lambda-generate-api-tests document/detail-designs/graphql/user/createUserInfo.md` to generate GraphQL E2E tests.
10. Run `/lambda-generate-feature-tests document/specs/my-feature/index.md` to generate feature E2E tests.
11. Run `/lambda-generate-unit-tests user` to generate unit tests for a domain module.

### When Adding a New Module

1. Create `brain/modules/{ModuleName}.md` (copy from `_template.md`).
2. Update `brain/project-context.json`.

### When Adding a New Feature

1. Create `brain/features/{feature-name}.md` (copy from `_template.md`).
2. Write a high-level flow (3-7 steps).

### When Updating Rules

Edit files directly in `rules/`. All skills will automatically use the updated rules.

## Maintenance Guidelines

- **brain/**: Update when flows change significantly. No need to update for every bug fix.
- **rules/**: Update when the team adopts new conventions.
- **skills/**: Update when AI workflows change. After adding a skill under `.github/skills/`, symlink it: `ln -sf "../../.github/skills/{name}" ".cursor/skills/{name}"`.
- **Do not over-document**: if a document needs frequent maintenance, it is probably too detailed.
