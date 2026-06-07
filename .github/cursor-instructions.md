# LambdaAPIs — Cursor Instructions

Use this file when working in **Cursor** (Agent / Chat). Shared constitution: `copilot-instructions.md`.

## Copilot vs Cursor — skills

|                 | GitHub Copilot                                    | Cursor IDE                                                                                                        |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Skill files** | `.github/skills/{name}/SKILL.md`                  | `.cursor/skills/{name}/SKILL.md` (symlink → `.github/skills/`)                                                    |
| **Invoke**      | Slash command: `/lambda-graphql-impl docs/foo.md` | **No slash commands.** Describe the task in chat; Cursor matches `description` in frontmatter and loads the skill |
| **Rules**       | `copilot-instructions.md`                         | `.cursor/rules/*.mdc` + optional read of `copilot-instructions.md`                                                |

Cursor does **not** read `.github/skills/` directly. Symlinks under `.cursor/skills/` point to the same content so both tools stay in sync.

## What Cursor loads

| Source                            | Purpose                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| `.cursor/rules/*.mdc`             | Always-on project rules                                            |
| `.cursor/skills/*/SKILL.md`       | Auto-discovered workflows (via `name` + `description` frontmatter) |
| `.github/copilot-instructions.md` | Full constitution — read on complex tasks                          |
| `.github/rules/`                  | Architecture, TypeScript, testing                                  |
| `.github/brain/`                  | Project memory                                                     |
| `.github/mcp/`                    | PR/MR/issue tool references                                        |

## Skills (Cursor — natural language)

Agent should apply the matching skill when the user asks for:

| Task                   | Skill (under `.cursor/skills/`) |
| ---------------------- | ------------------------------- |
| Init / verify context  | `lambda-init`                   |
| PR review              | `lambda-pr-review`              |
| Spec review            | `lambda-spec-review`            |
| GraphQL design doc     | `lambda-graphql-design`         |
| GraphQL implementation | `lambda-graphql-impl`           |
| REST design doc        | `lambda-rest-design`            |
| REST implementation    | `lambda-rest-impl`              |

Example prompts (no `/` needed):

- _Review PR #42_
- _Implement createUserInfo from `document/detail-designs/graphql/users/createUserInfo.md`_

If the agent does not pick the right skill, say explicitly: _Follow the `lambda-graphql-impl` skill_.

## Key conventions (quick reference)

- **Datasource DI modules** (`src/config/di/datasources/*.di.ts`): `{Name}DatasourceModule` (e.g. `DatabaseDatasourceModule`)
- **Common repo DI**: `CommonUserRepo` in `src/config/di/repos/user.di.ts`
- **Implementation classes** in `src/common/datasources/**/implements/`: `{Name}Datasource` — not DI modules
- **Errors**: `ERROR_MESSAGE` from `src/common/constants/response.const.ts`
- **Tests**: generic fixtures — avoid vehicle/domain-specific names unless the test is about that domain
- **Detail design** (`document/detail-designs/`) is source of truth for new APIs

## MCP

Detect platform from `git remote` — see `.github/mcp/README.md`.
