# Postman

Generic collections to call deployed Auth API and Public API. Values live only in **LAMBDA-ENV** — no secrets in collection files.

## Files

| File                                        | Purpose                                                |
| ------------------------------------------- | ------------------------------------------------------ |
| `LAMBDA-ENV.postman_environment.json`       | All config + runtime vars (fill `YOUR_*` placeholders) |
| `LAMBDA-AUTH.postman_collection.json`       | Run **A → B → C** to obtain temp AWS credentials       |
| `LAMBDA-PUBLIC-API.postman_collection.json` | `GET /user` (after auth)                               |

## Setup

1. Import all three files.
2. Select environment **LAMBDA-ENV**.
3. Replace every `YOUR_*` value (Cognito, API Gateway URLs, API keys, region).

## Run order

1. **LAMBDA-AUTH** (Collection Runner: A → B → C) → sets `ACCESS_KEY`, `SECRET_KEY`, `SESSION_TOKEN`
2. **LAMBDA-PUBLIC-API** → `GET /user`

Export environment after auth if you need to persist credentials locally (do not commit filled env).

## Environment variables

| Key                                                             | When                |
| --------------------------------------------------------------- | ------------------- |
| `REGION`, `CLIENT_ID`, `USERNAME`, `PASSWORD`, `LOGIN_PROVIDER` | Cognito (step A, C) |
| `COOKIE_NAME`, `AUTH_API_URL`, `X_AUTH_API_KEY`                 | Auth API (step B)   |
| `PUBLIC_API_URL`, `X_PUBLIC_API_KEY`                            | Public API          |
| `ID_TOKEN`, `IDENTITY_ID`, `IDENTITY_LOGIN_TOKEN`               | Set by A / B        |
| `ACCESS_KEY`, `SECRET_KEY`, `SESSION_TOKEN`                     | Set by C            |
