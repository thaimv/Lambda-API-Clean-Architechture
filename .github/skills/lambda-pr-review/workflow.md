# PR Review Workflow

## Prerequisites

- `.github/brain/project-context.json` populated (run `/lambda-init` if not)
- Platform tools reference (loaded in Step 0 based on the detected host; see `.github/mcp/README.md`):
  - GitHub → `.github/mcp/github-tools-reference.md`
  - GitLab → `.github/mcp/gitlab-tools-reference.md`
  - Azure DevOps → `.github/mcp/ado-tools-reference.md`

## Tool Selection — Minimize Terminal Approvals

Terminal commands require user approval. To reduce friction:

| Need                     | Use                               | NOT                   |
| ------------------------ | --------------------------------- | --------------------- |
| Read file in working dir | `read_file` tool                  | `cat`, `head`, `tail` |
| Search text in workspace | `grep_search` tool                | `grep -rn`, `rg`      |
| Find files by pattern    | `file_search` tool                | `find`, `ls`          |
| List directory           | `list_dir` tool                   | `ls`                  |
| Read file from PR branch | `git show branch:file` (terminal) | —                     |
| Get unified diff         | `git diff` (terminal)             | —                     |
| Fetch remote branches    | `git fetch` (terminal)            | —                     |

**Rule**: Only use terminal for git operations that require branch-specific access.

**Batch git commands**: Chain multiple `git show` calls in one terminal command:

```bash
# ✅ Good — one terminal approval
git show branch:file1 && echo "---SEPARATOR---" && git show branch:file2
```

## Rules to Load

Always:

- `.github/rules/architecture.md`
- `.github/rules/typescript-coding-standards.md`
- `./review-criteria.md`

Conditional:

- Tests changed → `.github/rules/testing-strategy.md`
- Per affected module → `.github/brain/modules/{ModuleName}.md` (only modules touched by PR)

## Templates

- `./templates/review-report.md` — chat summary format
- `./templates/review-comment.md` — PR inline comment format

---

## Step 0: Load State & Detect Platform

1. Read `.github/brain/project-context.json` — verify `generated_at` is not null.
   - If null → stop: `Run /lambda-init first to initialize project context.`
2. Detect the hosting platform from the git remote:

   ```bash
   git remote get-url origin
   ```

   - Contains `github.com` → **GitHub** → load `.github/mcp/github-tools-reference.md`.
   - Contains `gitlab.com` / self-hosted GitLab → **GitLab** → load `.github/mcp/gitlab-tools-reference.md`.
   - Contains `dev.azure.com` / `*.visualstudio.com` → **Azure DevOps** → load `.github/mcp/ado-tools-reference.md`.
   - Ambiguous/none → ask the user which platform the PR/MR is on.

3. Use the tool names from the loaded reference for all PR/MR API operations below.

---

## Step 1: FETCH — Collect PR Data

1. Get PR/MR metadata via the platform's "Get PR/MR info" tool (title, author, source/target branches, status, reviewers, repository name).
   - GitHub: `mcp_github_get_pull_request` (`pullNumber`)
   - GitLab: `mcp_gitlab_get_merge_request` (`merge_request_iid`)
   - Azure DevOps: `mcp_azure-devops_repo_get_pull_request_by_id` (`pullRequestId`)
2. **Validate repository**: If PR's repository is NOT `LambdaAPI` → stop:
   ```
   ❌ PR {PR_ID} belongs to repository "{repo_name}", not LambdaAPI.
   ```
3. **Fetch diff locally via git** (preferred):
   ```bash
   git fetch origin {source_branch}:{source_branch} {target_branch}:{target_branch}
   git diff {target_branch}...{source_branch} -- . \
     ':!*.js' ':!*.js.map' ':!package-lock.json' ':!*.generated.ts'
   ```
4. **Validate content**: If filtered diff is empty (no reviewable files) → stop:
   ```
   ❌ PR {PR_ID} has no reviewable changes after diff filters.
   ```
5. Parse diff → identify affected modules and layers.

---

## Step 2: ANALYZE — Review Code

Load relevant module docs from `brain/modules/` for affected modules.

Review each changed file against the loaded rules and [review-criteria.md Checks by Category](./review-criteria.md#checks-by-category):

- Walk each affected **category** (`ARCHITECTURE`, `LAYERING`, `VALIDATION`, …) — only sections whose files/layers changed.
- Tag each finding with one category (marker key) and severity (🔴–🟢) from `review-criteria.md`.
- Also apply conditional rules: `architecture.md`, `typescript-coding-standards.md`, `testing-strategy.md` (when tests changed).

---

## Step 3: CONFIRM & PUSH — Await Approval

1. Show the review report in chat.
2. Build idempotent comment payload (shared for auto/manual push):

- List all existing PR/MR comments via the platform's "list comments" tool (GitHub: `mcp_github_get_pull_request_comments`; GitLab: `mcp_gitlab_mr_discussions`; Azure DevOps: `mcp_azure-devops_repo_list_pull_request_threads`).
- For each finding, generate marker:
  - `<!-- copilot-review: {filePath}:{startLine}:{category} -->`
- `category` MUST come from Finding Categories in `./review-criteria.md`.
- If any existing thread content already contains the marker, skip that finding (already posted).
- If marker is not found, append marker at the bottom of comment body and mark as ready-to-post.

3. Resolve auto-push mode from the `--auto_push` flag:

- `--auto_push=true` → auto.
- `--auto_push=false` or omitted → manual (default).

4. Apply the resolved mode (inline comments use the platform's tool):

- **GitHub**: open a pending review (`mcp_github_create_pending_pull_request_review`), add each finding (`mcp_github_add_pull_request_review_comment_to_pending_review` with `path`/`line`/`body`), then submit with `event: COMMENT` (`mcp_github_submit_pending_pull_request_review`). General summary → `mcp_github_add_issue_comment`.
- **GitLab**: `mcp_gitlab_create_merge_request_thread` per finding (with `position` from MR diff refs). General summary → `mcp_gitlab_create_merge_request_note`.
- **Azure DevOps**: `mcp_azure-devops_repo_create_pull_request_thread` per finding.
- If auto-push:
  - Announce: "Auto-push enabled (`--auto_push=true`) → push comments without confirmation."
  - Prepare comment queue before push:
    - Sort findings by severity (highest first): `CRITICAL` → `HIGH` → `MEDIUM` → `LOW`.
    - De-duplicate findings by key `(filePath, startLine, category)` to ensure each comment is pushed once.
    - Apply max comments limit from `REVIEW_MAX_ISSUES` (fallback: `10` if empty/invalid).
    - Remove findings already posted by marker check from step 2.
    - If findings exceed the limit, push only top-N by severity and mention skipped count in summary.
  - Push comments from the prepared queue using the platform's inline-comment tool for each finding.
  - Push the summary as a general PR comment (first or last).
  - Report the comment/thread IDs pushed and number of skipped duplicates.
- Else (default/manual mode):
  - Ask: "Do you want me to push {n} comments to the PR?"
  - **WAIT** for explicit "yes" before pushing.
  - If approved → push only findings not matched by marker, using the platform's inline-comment tool for each finding.
  - Push the summary as a general PR comment (first or last).
  - Report the comment/thread IDs pushed and number of skipped duplicates.

---

## Step 4: DECISION & VOTE RECOMMENDATION

Derive Decision and Recommended vote from [review-criteria.md Decision & Vote Mapping](./review-criteria.md#decision--vote-mapping) (do NOT vote automatically):

```
📊 Decision: {APPROVE / APPROVE_WITH_COMMENTS / REQUEST_CHANGES}
📊 Recommended vote: {Approved / Approved with suggestions / Waiting for author / Rejected}
⚠️  You must vote manually on the PR page.
```
