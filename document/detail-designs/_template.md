[[_TOC_]]

# [API Name]

> Generated from spec: `document/specs/[pbi-id].md`
> **Next step:** Run `/lambda-graphql-impl document/detail-designs/graphql/[module]/[api-name].md` or `/lambda-rest-impl document/detail-designs/rest/[module]/[api-name].md` to implement.

> **Tip**: Use `/lambda-graphql-design {document/specs/pbi-xxx.md}` or `/lambda-rest-design {document/specs/pbi-xxx.md}` to auto-generate this document from a PBI spec.

## Description

[Short description of what this API does]

## Environment

- No additional custom variables.

<!-- Or list custom env vars, e.g.:
- `ENV_VAR_NAME`
  - [Description]
  - Default: `[value]`
-->

<!-- For GraphQL APIs, use this section -->

## GraphQL Schema

```graphql
input [InputType] {
  [field]: [ScalarType]!
}

type [ReturnType] {
  [field]: [ScalarType]
}

type Mutation {
  [fieldName](input: [InputType]): [ReturnType]!
}
```

<!-- For REST APIs, use this section instead -->

## Endpoint

- Method: `[GET | POST | PUT | PATCH | DELETE]`
- Path: `/[resource_path]`
- Lambda: `[lambda-name]`

## Request

### Request example

<!-- GraphQL -->

```graphql
mutation [MutationName] {
  [fieldName](input: { [field]: "[value]" }) {
    [field1]
    [field2]
  }
}
```

<!-- REST -->

```json
{}
```

### Request params

<!-- USE table when params exist -->

| Item name | Validation        | Type   |
| --------- | ----------------- | ------ |
| `[field]` | required, [rules] | String |

<!-- bullet list when no params -->

- No parameters required.

## Response

### Success

<!-- GraphQL -->

```json
{
  "data": {
    "[fieldName]": {
      "[field1]": "[value1]",
      "[field2]": "[value2]"
    }
  }
}
```

<!-- REST -->

```json
{
  "result": {
    "code": "SC-001",
    "message": "Success"
  },
  "data": {
    "[field1]": "[value1]",
    "[field2]": "[value2]"
  }
}
```

### Error

<!-- GraphQL — AppSync client format (all GraphQL APIs use this structure) -->

#### EB-004 — Validation failed

```json
{
  "data": {
    "[fieldName]": null
  },
  "errors": [
    {
      "message": "Failed to validate [field path]",
      "errorType": "EB-004",
      "data": null,
      "errorInfo": "EB-004",
      "path": ["[fieldName]"],
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
    "[fieldName]": null
  },
  "errors": [
    {
      "message": "Unauthorized",
      "errorType": "EB-001",
      "data": null,
      "errorInfo": "EB-001",
      "path": ["[fieldName]"],
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
    "[fieldName]": null
  },
  "errors": [
    {
      "message": "An unexpected error occurred.",
      "errorType": "ES-001",
      "data": null,
      "errorInfo": "ES-001",
      "path": ["[fieldName]"],
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

<!-- Some REST errors -->

#### EB-004 — Validation failed

```json
{
  "result": {
    "code": "EB-004",
    "message": "Bad request."
  },
  "error": {
    "error_message": "[validation error detail]",
    "error_detail": null
  }
}
```

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

<!-- GraphQL -->

| Field     | Description   |
| --------- | ------------- |
| `[field]` | [description] |

<!-- REST -->

| Field     | Type   | Nullable | Description   |
| --------- | ------ | -------- | ------------- |
| `[field]` | String | Yes      | [description] |

---

# Coding Design

## Step 1: [First step]

- [e.g. Validate request params / Extract userId from auth context]

## Step 2: [Main processing]

- [e.g. Upsert record in `users` table keyed by `gigyaUuid`]

## Step N: Return response

- Return [result description].

## Sequence diagram

<!-- GraphQL -->

:::mermaid
sequenceDiagram
participant Client
participant AppSync
participant Lambda
participant Repo
participant DB as Database

    Client->>AppSync: [Request description]
    AppSync->>Lambda: Invoke with field + arguments + identity

    Lambda->>Lambda: Validate input
    Lambda-->>AppSync: EB-004 if validation fails

    Lambda->>Lambda: Extract auth user from identity
    Lambda-->>AppSync: EB-001 if missing

    Lambda->>Repo: [Repo call]
    Repo->>DB: [DB query]
    DB-->>Repo: [Result]
    Repo-->>Lambda: [Domain model]

    Lambda->>AppSync: Return response
    AppSync->>Client: { data: { [fieldName]: { ... } } }

:::

<!-- REST -->

:::mermaid
sequenceDiagram
participant Client
participant APIGateway as API Gateway
participant Lambda
participant Controller

    Client->>APIGateway: [HTTP METHOD] /[endpoint]
    APIGateway->>Lambda: Invoke with identity context

    Lambda->>Controller: route to [Controller].[method](event)
    Controller->>Controller: [Processing step]
    Controller-->>Lambda: EB-001 if auth missing

    Controller->>Lambda: Return [response data]
    Lambda->>APIGateway: SuccessResponse SC-001
    APIGateway->>Client: 200 OK

:::
