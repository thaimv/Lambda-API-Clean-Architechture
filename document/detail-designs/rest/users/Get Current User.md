[[_TOC_]]

# Get Current User

## Description

Return currently authenticated user info from API Gateway identity context.

## Environment

- No additional custom variables.

## Endpoint

- Method: `GET`
- Path: `/user`
- Lambda: `public-rest-api`

## Request

### Request example

```json
{}
```

### Request params

- No parameters required.

## Response

### Success

```json
{
  "result": {
    "code": "SC-001",
    "message": "Success"
  },
  "data": {
    "gigyaUuid": "958b52daa72f4f0497679e1aeaa32dab",
    "username": "example_user",
    "cognitoIdentityId": "ap-southeast-1:11111111-2222-3333-4444-555555555555"
  }
}
```

### Error

#### EB-001 — Unauthorized

```json
{
  "result": {
    "code": "EB-001",
    "message": "Unauthorized."
  },
  "error": {
    "error_message": "Unauthorized.",
    "error_detail": null
  }
}
```

#### ES-001 — Internal Server Error

```json
{
  "result": {
    "code": "ES-001",
    "message": "An unexpected error occurred."
  },
  "error": {
    "error_message": "An unexpected error occurred.",
    "error_detail": null
  }
}
```

## Field notes

| Field             | Type   | Nullable | Description                                         |
| ----------------- | ------ | -------- | --------------------------------------------------- |
| gigyaUuid         | String | Yes      | User ID extracted from auth context                 |
| username          | String | Yes      | Username extracted from auth context                |
| cognitoIdentityId | String | Yes      | Cognito identity ID extracted from request identity |

---

# Coding Design

## Step 1: Extract auth user

- Extract `gigyaUuid` from `event.requestContext.identity.cognitoIdentityAuthProvider`.
- Extract `username` from `event.requestContext.identity.cognitoAuthenticationProvider`.
- Extract `cognitoIdentityId` from `event.requestContext.identity.cognitoIdentityId`.
- If all fields are null/missing → throw `EB-001`.

## Step 2: Return user info

- No DB call needed — all data comes directly from API Gateway identity context.
- Return `{ gigyaUuid, username, cognitoIdentityId }` wrapped in `SuccessResponse.create(data)`.

## Sequence diagram

:::mermaid
sequenceDiagram
participant Client
participant APIGateway as API Gateway
participant Lambda
participant Controller

    Client->>APIGateway: GET /user
    APIGateway->>Lambda: Invoke with identity context

    Lambda->>Controller: route to UsersRestController.getCurrentUser(event)
    Controller->>Controller: Extract gigyaUuid, username, cognitoIdentityId from identity
    Controller-->>Lambda: `EB-001` if all fields missing

    Controller->>Lambda: Return { gigyaUuid, username, cognitoIdentityId }
    Lambda->>APIGateway: SuccessResponse SC-001
    APIGateway->>Client: 200 OK

:::
