---
name: lambda-init
description: 'Initialize or verify project context — scan modules, check MCP, verify prerequisites. Use when: first setup, verify readiness, check drift.'
argument-hint: 'Optional: --check to verify only'
---

# Initialize & Verify Project Context

## Input

```
/lambda-init                ← First time: scan + setup
/lambda-init --check        ← Verify: check prerequisites + detect drift
```

## Goal

**First run**: Scan codebase → populate `project-context.json`.
**Subsequent runs**: Verify `project-context.json` is up-to-date, check MCP connectivity, report readiness.

## Prerequisites

- Read `.github/brain/project-context.json`.
  - If `generated_at != null` and no explicit flag → run in `--check` mode automatically.
  - If `generated_at` is null or file missing → run full scan.

## Rules to Load

- `.github/rules/architecture.md` — to validate module structure during scan
- Platform tools reference for MCP verification (detect host from `git remote get-url origin`; see `.github/mcp/README.md`):
  - GitHub → `.github/mcp/github-tools-reference.md`
  - GitLab → `.github/mcp/gitlab-tools-reference.md`
  - Azure DevOps → `.github/mcp/ado-tools-reference.md`

## Safety

- Read-only operations — no builds, no pushes, no destructive actions.
- Do NOT run `npm run build` (esbuild bundle — slow).

## Workflow

### Mode Detection

1. Read `.github/brain/project-context.json`.
2. If `generated_at` is null or file missing → **Full Scan** (Steps 1–3).
3. If `generated_at` exists → **Verify Mode** (Steps 2–3 only, plus drift check).

### Step 1: Scan Modules (Full Scan only)

1. List `src/modules/` → subdirectories are domain modules (e.g. `users/`). Composition modules are `*.module.ts` files at the root of `src/modules/` (e.g. `public-rest-api.module.ts`, `appsync-api.module.ts`).
2. For each module: check if `usecases/`, `repos/`, `dtos/`, `controllers/` directories exist (unit tests live under `tests/unit-test/modules/{module}/`, not inside the module).
3. Determine which Lambda stack(s) wire this module by reading the composition modules in `src/modules/` (`public-rest-api.module.ts`, `appsync-api.module.ts`) and the routers in `src/config/routes/`.
4. Determine DB type by scanning which datasource token from `src/common/constants/di.const.ts` the module's repo injects (e.g. `DI.DB_CLIENT_DATASOURCE` → Aurora/Prisma).
5. Build `modules` map for `project-context.json`.
6. Set `generated_at` to current ISO timestamp.

### Step 2: Verify / Drift Check (both modes)

1. List `src/modules/` → compare against `modules` keys in `project-context.json`.
2. Report any new modules not in json, or modules in json that no longer exist.
3. If drift detected → warn and suggest running `/lambda-init` (full scan).

### Step 3: Verify MCP Connectivity

1. Detect platform from `git remote get-url origin`.
2. Test the matching MCP:
   - GitHub → e.g. `mcp_github_get_me` (or list branches for the repo).
   - GitLab → e.g. `mcp_gitlab_get_merge_request` on a known MR (or list projects).
   - Azure DevOps → `mcp_azure-devops_core_list_projects`.
3. Success → set the matching capability flag (`github_mcp` / `gitlab_mcp` / `azure_devops_mcp`) to `true`.
4. Failure → report as warning, do not block.

### Step 4: Report

Print a readiness summary:

```
✅ project-context.json — up-to-date ({n} modules)
✅ MCP Azure DevOps — connected
⚠️  Drift detected: {new_modules} not documented
```
