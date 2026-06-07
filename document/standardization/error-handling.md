# Error Handling

Errors are classified with custom classes in `src/common/errors/` and mapped to **result codes** (`RESULT_CODE` in `src/common/constants/response.const.ts`). Lambda handlers do **not** use inline `try/catch` — pipeline pipes handle errors centrally.

---

## Architecture

```
Controller / UseCase throws BaseError subclass
       ↓
GraphQLErrorHandlingPipe  (AppSync)
ApiErrorHandlingPipe      (REST)
       ↓
Formatted response returned to client
```

| Pipe                       | Lambda        | Location                                                 |
| -------------------------- | ------------- | -------------------------------------------------------- |
| `GraphQLErrorHandlingPipe` | `appsync-api` | `src/common/lambda/pipes/graphql-error-handling.pipe.ts` |
| `ApiErrorHandlingPipe`     | `public-api`  | `src/common/lambda/pipes/api-error-handling.pipe.ts`     |

Non-`BaseError` exceptions become `InternalServerError` (`ES-001`).

---

## AppSync (GraphQL)

### Resolver mapping

AppSync maps Lambda errors via `util.error` in the response mapping template (`out/simulator/src/invoke/response.vtl`):

```vtl
#set($error = $context.result.error)
#if($error)
  $util.error($error.message, $error.extensions.code, null, $error.extensions.code)
#end
$util.toJson($context.result)
```

### Client response format

`errorType` and `errorInfo` are both `RESULT_CODE` values. The failed field is `null` in `data`.

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
      "locations": [{ "line": 2, "column": 3, "sourceName": "GraphQL request" }]
    }
  ]
}
```

### Lambda internal format (before AppSync maps)

Returned by `BaseError.toCustomError()`:

```json
{
  "error": {
    "message": "Failed to validate input, userNickname",
    "extensions": {
      "code": "EB-004",
      "statusCode": 400,
      "details": null
    }
  }
}
```

Success — field data only, no `errors` array:

```json
{
  "gigyaUuid": "...",
  "userNickname": "example_user",
  "cognitoId": "..."
}
```

---

## API Gateway (REST)

### Error response

```json
{
  "result": {
    "code": "EB-004",
    "message": "Failed to validate: input.userNickname - Required"
  },
  "error": {
    "error_message": "Failed to validate: input.userNickname - Required",
    "error_detail": {}
  }
}
```

Built by `ErrorResponse.fromError()` in `src/common/responses/api-error-response.ts`.

### Success response

```json
{
  "result": {
    "code": "SC-001",
    "message": "Success"
  },
  "data": {}
}
```

Built by `SuccessResponse` in `src/common/responses/api-success-response.ts`.

`ApiErrorHandlingPipe` also converts uncaught `ZodError` to `ValidationError` (`EB-004`).

---

## Error Classes

All extend `BaseError` (`src/common/errors/base-error.ts`).

| Situation               | Class                 | Code     | HTTP status |
| ----------------------- | --------------------- | -------- | ----------- |
| Unauthenticated         | `UnauthorizedError`   | `EB-001` | 401         |
| Business rule violated  | `BadRequestError`     | `EB-002` | 400         |
| Resource not found      | `NotFoundError`       | `EB-003` | 404         |
| Input validation failed | `ValidationError`     | `EB-004` | 400         |
| Resource already exists | `ExistedError`        | `EB-009` | 400         |
| Unexpected error        | `InternalServerError` | `ES-001` | 500         |
| Secrets not found       | —                     | `ES-002` | 500         |
| Database URL not found  | —                     | `ES-003` | 500         |

Messages for user-facing errors live in `ERROR_MESSAGE` (`src/common/constants/response.const.ts`).

### Usage in use cases

```typescript
import { ExistedError } from '@/common/errors/existed-error';
import { ERROR_MESSAGE } from '@/common/constants/response.const';

if (existingUser && existingUser.gigyaUuid !== authUser.userId) {
  throw new ExistedError(ERROR_MESSAGE.USER_NICKNAME_ALREADY_EXISTS);
}
```

### Validation at controller boundary

GraphQL: `@ValidationArgs(schema)` → throws `ValidationError` on Zod failure.

REST: Zod errors caught by `ApiErrorHandlingPipe.transformError()`.

---

## Result Codes (`RESULT_CODE`)

Defined in `src/common/constants/response.const.ts`:

| Code     | Constant                    | Type     |
| -------- | --------------------------- | -------- |
| `SC-001` | `SUCCESS`                   | Success  |
| `EB-001` | `UNAUTHORIZED`              | Business |
| `EB-002` | `BAD_REQUEST`               | Business |
| `EB-003` | `NOT_FOUND`                 | Business |
| `EB-004` | `VALIDATION_BUSINESS_ERROR` | Business |
| `EB-009` | `EXISTED`                   | Business |
| `ES-001` | `INTERNAL_SERVER_ERROR`     | System   |
| `ES-002` | `SECRETS_NOT_FOUND`         | System   |
| `ES-003` | `DATABASE_URL_NOT_FOUND`    | System   |

**Naming rule:** codes use the `SC-` / `EB-` / `ES-` prefix pattern. Do not invent ad-hoc string codes outside `RESULT_CODE`.

---

## Rules

1. Throw `BaseError` subclasses — never raw `new Error(...)`.
2. Do not add `try/catch` in controllers or use cases for response formatting; let pipes handle it.
3. User-facing messages go in `ERROR_MESSAGE`; codes go in `RESULT_CODE`.
4. Never expose stack traces or raw DB errors in API responses.
