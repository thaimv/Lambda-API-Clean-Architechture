# lambda-init Workflow

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse input for `--check` flag; confirm it matches `manifest.yaml` → `input`.
3. Read `.github/brain/project-context.json` (treat missing file as uninitialized).
4. Choose mode:

| Input     | Context file                | Mode          | Steps                                           |
| --------- | --------------------------- | ------------- | ----------------------------------------------- |
| `--check` | missing / no `generated_at` | **Stop**      | Report: run `/lambda-init` first (no `--check`) |
| `--check` | exists                      | **Verify**    | 2 → 3 → 4 (read-only — do not rewrite maps)     |
| no flag   | missing / no `generated_at` | **Full Scan** | 2 → 3 → 4                                       |
| no flag   | exists                      | **Full Scan** | 2 → 3 → 4 (refresh context)                     |

---

## Step 2: Scan Codebase (Full Scan only)

### 1a — Discover modules

`src/modules/` contains **two kinds** of entries — scan both:

| Kind            | How to discover                                                                  | Example keys                            |
| --------------- | -------------------------------------------------------------------------------- | --------------------------------------- |
| **Composition** | `src/modules/*.module.ts` at the **root** of `src/modules/` (not inside subdirs) | `public-api`, `auth-api`, `appsync-api` |
| **Domain**      | Subdirectories directly under `src/modules/`                                     | `user`, `auth`                          |

For each **domain** module: inspect `usecases/`, `repos/`, `dtos/`, `controllers/`; tests under `tests/unit-test/modules/{name}/`.

For each **composition** module: read the `*.module.ts` file — note imported domain modules and datasource DI.

Build the `modules` map:

```json
{
  "<name>": {
    "area": "composition" | "domain",
    "purpose": "<one line from code/brain>",
    "lambda": ["<stack-names>"],
    "db": ["aurora" | ...],
    "has_tests": true | false
  }
}
```

- **Domain** `lambda` array: infer from which composition modules import it + routers in `src/config/routes/`.
- **Composition** `lambda` array: single entry matching the module name.
- `has_tests`: true if `tests/unit-test/modules/{name}/` has at least one test file.

### 1b — Discover Lambda stacks

List `src/presenter/lambdas/*.ts` (exclude non-entry helpers if any).

For each file, build a `lambdas` map entry:

```json
{
  "<lambda-name>": {
    "entry": "src/presenter/lambdas/<name>.ts",
    "module": "src/modules/<name>.module.ts",
    "router": "RestApiRouter" | "GraphQLRouter",
    "auth": "<short note from code>"
  }
}
```

Derive `router` from whether the presenter imports `RestApiRouter` or `GraphQLRouter`.

### 1c — Sync structured facts

Update in `project-context.json`:

- `repo_layout.areas.presenter`, `composition_modules`, `domain_modules` — from 1a / 1b scan results
- `commands` — align keys with `package.json` scripts (`build`, `test`, `test:ci`, `test:e2e`, `lint`, …)
- `key_files` — verify paths still exist; update if renamed

### 1d — Brain docs (warn only)

For each **domain** module key, check `.github/brain/modules/{Name}.md` exists (PascalCase filename matching module, e.g. `user.md`, `auth.md`). Report missing docs — do not auto-create in this step.

Set `generated_at` to current ISO timestamp (preserve `+07:00` offset style if already used).

Write updated `project-context.json`.

---

## Step 3: Verify / Drift Check (both modes)

Collect **expected keys** the same way as Step 1a / 1b — do not only list subdirectories:

```
composition_keys = basenames of src/modules/*.module.ts   # e.g. public-api
domain_keys      = subdirectories of src/modules/        # e.g. user, auth
expected_modules = composition_keys ∪ domain_keys

expected_lambdas = basenames of src/presenter/lambdas/*.ts
```

Compare against `modules` and `lambdas` keys in `project-context.json`:

| Drift type                                            | Action                                            |
| ----------------------------------------------------- | ------------------------------------------------- |
| In codebase, not in json                              | Report as **new** — Full Scan would add them      |
| In json, not in codebase                              | Report as **stale** — Full Scan would remove them |
| `repo_layout.areas` mismatch                          | Report drift                                      |
| `commands` mismatch vs `package.json`                 | Report drift                                      |
| Missing `brain/modules/{Name}.md` for a domain module | Report warning                                    |

**Verify mode (`--check`)**: report only — do not write `project-context.json`.

**Full Scan mode**: Step 1 already rewrote the file; use this step to confirm zero drift before reporting.

If drift found in Verify mode → suggest: `Run /lambda-init (without --check) to refresh project context.`

---

## Step 4: Verify MCP Connectivity

1. Detect platform from `git remote get-url origin` — see `.github/mcp/README.md`.
2. Test matching MCP (GitHub / GitLab / Azure DevOps).
3. On success → set the matching capability flag to `true` in `project-context.json` (`github_mcp`, `gitlab_mcp`, or `azure_devops_mcp`). Set `capabilities.host` to `github` | `gitlab` | `azure-devops`.
4. On failure → warning only; do not block. Leave flag `false`.

In **Verify mode**, update capability flags only if MCP status changed; do not rewrite module/lambda maps.

---

## Step 5 — Verify Output & Report

Use the **detected platform name** in the MCP line (not a hardcoded default):

```
✅ project-context.json — up-to-date ({n} modules, {m} lambdas)
✅ MCP {GitHub|GitLab|Azure DevOps} — connected
⚠️  Drift detected:
    - modules: {new_or_stale_keys}
    - lambdas: {new_or_stale_keys}
    - commands: {mismatched_keys}
⚠️  Missing brain docs: brain/modules/{Name}.md for {module}
ℹ️  Mode: Full Scan | Verify (--check)
```

| Check                  | Pass when                                    |
| ---------------------- | -------------------------------------------- |
| `project-context.json` | Written (Full Scan) or unchanged (`--check`) |
| `modules` / `lambdas`  | Match codebase scan                          |
| `generated_at`         | Updated on Full Scan                         |
| Report delivered       | User sees status summary in chat             |
| Output contract        | Matches `manifest.yaml` → `output`           |

If Verify mode and context file was missing:

```
❌ project-context.json not initialized — run /lambda-init first
```
