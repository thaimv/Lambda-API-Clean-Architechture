# PBI Information

PBI ID:
Title:
Platforms: Backend API

---

# 1. Main Objective (VERY IMPORTANT)

Describe EXACTLY ONE main change. Do not combine multiple unrelated feature changes.

Example:

- When a user submits their profile, the API must upsert the record into the `users` table keyed by `gigyaUuid`.

❌ Do not combine multiple unrelated features in a single PBI.
✅ Explain domain terms when they are not common (e.g., "gigyaUuid is the unique user identifier issued by Gigya, carried in the Cognito identity").

---

# 2. Requirement Description

Break down expected behavior into small steps, similar to writing tasks for a junior developer.

Example:

- GraphQL mutation `createUserInfo(input: { userNickname })` upserts the user.
- Validate `userNickname` with Zod at the controller boundary (`@ValidationArgs`): trimmed, min length 1.
- `UsersUseCase.saveUser` orchestrates → `UsersRepo.saveUser` performs a Prisma upsert keyed by `gigyaUuid`.
- If the request is unauthenticated (no Gigya UUID / username), return `401 Unauthorized`.
- Clarify difficult domain terms directly in the spec.

---

# 3. Affected Scope

## 3.1 Modules

List affected folders in `src/modules/`.

Example:

- `users`

## 3.2 Related Features

The higher-level feature this PBI belongs to. AI will load `brain/features/{feature-name}.md`.

Example:

- `create-user-info` — part of the user profile bootstrap flow

## 3.3 Feature Relationship

- Type: [standalone endpoint / sub-task of feature X / bug fix in feature Y]
- Affected Lambda stack: `public-rest-api` / `appsync-api`
- If sub-task: specify which step in the feature flow (see `brain/features/{name}.md`)

---

# 4. Constraints / Important Notes

Constraints that AI must not change on its own.

Example:

- Do not change the current schema of the `users` table.
- Do not add new endpoints; only extend existing endpoints.
- Backward compatible — do not break existing clients.

---

# 5. References (Optional)

- API contract / Swagger
- DB schema changes (Prisma migration)
- Existing endpoint spec

⚠️ Attach only documents that AI can actually access/read in the workspace.
Do not link external documents if AI cannot read their content.
