# PBI Information

PBI ID:
Title:
Platforms: Backend API

---

# 1. Main Objective

Describe EXACTLY ONE main change. Do not combine multiple unrelated features.

Example:

- When a user submits their profile, the API must upsert the record into the `users` table keyed by `gigyaUuid`.

❌ Do not combine multiple unrelated features in a single PBI.
✅ Explain domain terms that are not common knowledge.

---

# 2. Requirement Description

Break down expected behavior into small steps.

Example:

- GraphQL mutation `createUserInfo(input: { userNickname })` upserts the user.
- Validate `userNickname` with Zod (`@ValidationArgs`): trimmed, min length 1.
- `UserUseCase.saveUser` → `UserRepo.saveUser` performs a Prisma upsert keyed by `gigyaUuid`.
- If unauthenticated (no Gigya UUID / username), return `401 Unauthorized`.

---

# 3. Affected Scope

## 3.1 Modules

List affected folders in `src/modules/`.

Example:

- `users`

## 3.2 Related Features

The higher-level feature this PBI belongs to.

Example:

- `create-user-info` — part of the user profile bootstrap flow

## 3.3 Feature Relationship

- Type: [standalone endpoint / sub-task of feature X / bug fix in feature Y]
- Affected Lambda stack: `public-api` / `appsync-api`

---

# 4. Constraints / Important Notes

Example:

- Do not change the current schema of the `users` table.
- Backward compatible — do not break existing clients.

---

# 5. References (Optional)

- DB schema: `prisma/schema.prisma`
- Existing endpoint spec

⚠️ Only attach documents that AI can read in the workspace.

---

> **Next step (after PBI is approved):**
> Run `/lambda-graphql-design document/specs/this-file.md` or `/lambda-rest-design document/specs/this-file.md`
> to auto-generate the detail design doc → save output to `document/detail-designs/graphql/[module]/` or `document/detail-designs/rest/[module]/`.
