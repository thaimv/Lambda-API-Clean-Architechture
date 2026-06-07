[[_TOC_]]

# Create User Info (GraphQL)

## Description

Create or update a user record by `gigyaUuid` (upsert behavior), then return user info.

## Environment

- No additional custom variables.

## GraphQL Schema

```graphql
input UserInfoInput {
  userNickname: String!
}

type UserInfoResponse {
  gigyaUuid: String!
  userNickname: String!
  cognitoId: String
}

type Mutation {
  createUserInfo(input: UserInfoInput): UserInfoResponse
}
```

## Request

### Request example

```graphql
mutation CreateUserInfoMutation {
  createUserInfo(input: { userNickname: "example_user" }) {
    gigyaUuid
    userNickname
    cognitoId
  }
}
```

### Request params

| Item name    | Validation                                       | Type   |
| ------------ | ------------------------------------------------ | ------ |
| userNickname | required, trimmed, min length 1, unique per user | String |

## Response

### Success

```json
{
  "data": {
    "createUserInfo": {
      "gigyaUuid": "958b52daa72f4f0497679e1aeaa32dab",
      "userNickname": "example_user",
      "cognitoId": "ap-southeast-1:11111111-2222-3333-4444-555555555555"
    }
  }
}
```

### Error

All GraphQL errors use the AppSync client format: `errorType` and `errorInfo` are both `RESULT_CODE` values; the failed field is `null` in `data`.

#### EB-004 — Validation failed

```json
{
  "data": {
    "createUserInfo": null
  },
  "errors": [
    {
      "message": "Failed to validate input, userNickname",
      "errorType": "EB-004",
      "data": null,
      "errorInfo": "EB-004",
      "path": ["createUserInfo"],
      "locations": [
        {
          "line": 2,
          "column": 3,
          "sourceName": "GraphQL request"
        }
      ]
    }
  ]
}
```

#### EB-001 — Unauthorized

```json
{
  "data": {
    "createUserInfo": null
  },
  "errors": [
    {
      "message": "Unauthorized",
      "errorType": "EB-001",
      "data": null,
      "errorInfo": "EB-001",
      "path": ["createUserInfo"],
      "locations": [
        {
          "line": 2,
          "column": 3,
          "sourceName": "GraphQL request"
        }
      ]
    }
  ]
}
```

#### EB-009 — Nickname already taken by another user

```json
{
  "data": {
    "createUserInfo": null
  },
  "errors": [
    {
      "message": "userNickname already exists",
      "errorType": "EB-009",
      "data": null,
      "errorInfo": "EB-009",
      "path": ["createUserInfo"],
      "locations": [
        {
          "line": 2,
          "column": 3,
          "sourceName": "GraphQL request"
        }
      ]
    }
  ]
}
```

#### ES-001 — Internal Server Error

```json
{
  "data": {
    "createUserInfo": null
  },
  "errors": [
    {
      "message": "An unexpected error occurred.",
      "errorType": "ES-001",
      "data": null,
      "errorInfo": "ES-001",
      "path": ["createUserInfo"],
      "locations": [
        {
          "line": 2,
          "column": 3,
          "sourceName": "GraphQL request"
        }
      ]
    }
  ]
}
```

## Field notes

| Field        | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| gigyaUuid    | User ID extracted from auth context                         |
| userNickname | Nickname from input; must not belong to another active user |
| cognitoId    | Cognito identity ID from auth context, nullable             |

---

# Coding Design

## Step 1: Validate input

- `@ValidationArgs(createUserInfoDtoSchema)` validates `input.userNickname`: trimmed, min length 1.
- If invalid → throw `ValidationError` → AppSync returns `EB-004`.

## Step 2: Extract auth user

- Extract `gigyaUuid` from `context.identity.cognitoIdentityAuthProvider`.
- Extract `username` from `context.identity.username`.
- If missing → throw `UnauthorizedError`.

## Step 3: Check nickname uniqueness

- Query `users` where:
  - `user_nickname` = `input.userNickname`
  - `gigya_uuid` ≠ current user's `gigyaUuid`
- If a row exists → throw `ExistedError('userNickname already exists')` → AppSync returns `EB-009`.
- If no row exists, or the matched row belongs to the current user → continue.

## Step 4: Upsert user record

- `UserUseCase.saveUser(dto, authUser)` → `UserRepo.saveUser` performs Prisma `upsert` on `users` table keyed by `gigya_uuid`.

## Step 5: Return response

- Return `{ gigyaUuid, userNickname, cognitoId }`.

## Sequence diagram

:::mermaid
sequenceDiagram
participant Client
participant AppSync
participant Lambda
participant UserRepo
participant DB as PostgreSQL

    Client->>AppSync: mutation createUserInfo(input: { userNickname })
    AppSync->>Lambda: Invoke with field + arguments + identity

    Lambda->>Lambda: @ValidationArgs — validate userNickname
    Lambda-->>AppSync: EB-004 if validation fails

    Lambda->>Lambda: Extract gigyaUuid + username from identity
    Lambda-->>AppSync: EB-001 if missing

    Lambda->>UserRepo: findActiveUserByNickname(userNickname)
    UserRepo->>DB: SELECT users WHERE user_nickname = ? AND delete_datetime IS NULL
    DB-->>UserRepo: row or null
    Lambda-->>AppSync: EB-009 if nickname belongs to another user

    Lambda->>UserRepo: saveUser(dto, authUser)
    UserRepo->>DB: UPSERT users WHERE gigya_uuid = gigyaUuid
    DB-->>UserRepo: upserted row
    UserRepo-->>Lambda: { gigyaUuid, userNickname, cognitoId }

    Lambda->>AppSync: Return UserInfoResponse
    AppSync->>Client: { data: { createUserInfo: { ... } } }

:::
