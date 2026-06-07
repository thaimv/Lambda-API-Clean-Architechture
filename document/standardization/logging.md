# Logging

Structured logging via **@aws-lambda-powertools/logger**. Logging runs in **pipeline pipes** — not inline in Lambda handlers.

---

## Logger Setup

`src/common/logger/index.ts`:

- `logger` — general-purpose logger
- `primaryLogger` — structured API execution log (INFO level for request/response summary)
- `CustomLogFormatter` — includes `logLevel`, `timestamp`, `message`, `lambdaRequestId`
- `jsonReplacerFn` — masks sensitive fields before output

```typescript
import { Logger, LogFormatter, LogItem } from '@aws-lambda-powertools/logger';

export const logger = new Logger({
  logFormatter: new CustomLogFormatter(),
  serviceName: APP_CONST.SERVICE_NAME,
  logLevel: APP_CONST.LOGGER.LOG_LEVEL as LogLevel,
  jsonReplacerFn,
});
```

Reference: [Powertools Logger](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger)

---

## Pipeline Integration

| Pipe                 | Lambda        | File                                              |
| -------------------- | ------------- | ------------------------------------------------- |
| `GraphQLLoggingPipe` | `appsync-api` | `src/common/lambda/pipes/graphql-logging.pipe.ts` |
| `ApiLoggingPipe`     | `public-api`  | `src/common/lambda/pipes/api-logging.pipe.ts`     |

Handlers wire pipes before error-handling pipes:

```typescript
// appsync-api.ts
.through([new GraphQLLoggingPipe(), new GraphQLErrorHandlingPipe()])

// public-api.ts (via Lambda class)
[new ApiLoggingPipe(), new ApiErrorHandlingPipe()]
```

---

## What Gets Logged

### On every request (primaryLogger.info)

Both pipes log a summary after execution:

| Field            | GraphQL                               | REST                           |
| ---------------- | ------------------------------------- | ------------------------------ |
| `apiName`        | `event.field` (e.g. `createUserInfo`) | `{method} {path}`              |
| `result.status`  | `Success` / `Failure`                 | `Success` / `Failure`          |
| `result.message` | Error message or `Success`            | Response message or `Success`  |
| `input`          | `event.arguments`                     | Full API Gateway event         |
| `output`         | Lambda return value                   | Response `data`                |
| `error`          | `{ message, trace }` if failed        | `{ message, trace }` if failed |

`lambdaRequestId` is set automatically via `logger.addContext(context)`.

### On failure

Error pipes log via the logging pipe's `error` field (message + stack trace). Do not log sensitive data — `jsonReplacerFn` redacts known sensitive keys.

---

## Rules

1. **Mask PII** — personal data must be masked or omitted (handled by `jsonReplacerFn` + `sensitive-data.util.ts`).
2. **Include `lambdaRequestId`** — set via `addContext(context)` in logging pipes.
3. **Do not log in handlers** — add logging in pipes or at repository/use-case level with `logger.debug()` when needed for diagnostics.
4. **Log levels:** `DEBUG`, `INFO`, `WARN`, `ERROR` — controlled by `APP_CONST.LOGGER.LOG_LEVEL`.

---

## Log Format (primaryLogger)

```json
{
  "logLevel": "INFO",
  "timestamp": "2026-06-07T12:00:00.000Z",
  "message": "Success",
  "lambdaRequestId": "abc-123",
  "apiName": "createUserInfo",
  "result": {
    "status": "Success",
    "message": "Success"
  },
  "input": { "input": { "userNickname": "example_user" } },
  "output": { "gigyaUuid": "...", "userNickname": "example_user" }
}
```

On failure, `error` is added:

```json
{
  "error": {
    "message": "userNickname already exists",
    "trace": ["ExistedError: userNickname already exists", "..."]
  }
}
```

---

## Debug Logging in Repositories (optional)

Use `logger.debug()` for non-sensitive diagnostic info:

```typescript
import { logger } from '@/common/logger';

logger.debug('UserRepo.saveUser', { userId: authUser.userId });
```

Keep debug logs free of passwords, tokens, or full identity payloads.
