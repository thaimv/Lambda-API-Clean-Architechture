# auth

> Loaded when reviewing or developing the auth domain module.

## Overview

- **Tier**: domain
- **Purpose**: Exchange access token (JWT cookie) for Cognito federated identity token
- **Lambdas**: `auth-api`
- **Dependencies**: Cognito Identity (`DI.COGNITO_IDENTITY_DATASOURCE`)

## Folder Structure

```
src/modules/auth/
├── auth.const.ts                                         # DI tokens: AUTH_DI_CONST
├── auth.rest.module.ts                                   # @Module wiring AuthRestController
├── controllers/auth.rest.controller.ts                   # @Post(PathAuthApi.PostCredential)
├── dtos/requests/get-identity-token.request.dto.ts       # GetIdentityTokenRequestSchema (Zod)
├── repos/
│   ├── identity-token.repo.ts                            # IIdentityTokenRepo interface
│   └── implements/cognito-identity.repo.impl.ts          # CognitoIdentityRepo
├── usecases/
│   ├── get-identity-token.uc.ts                          # IGetIdentityTokenUseCase interface
│   └── implement/get-identity-token.uc.impl.ts           # GetIdentityTokenUseCase
└── models/identity-token.model.ts                        # IdentityTokenResult type
```

Tests: `tests/unit-test/modules/auth/`

## DI Wiring

- `AUTH_DI_CONST.IGetIdentityTokenUseCase` — injected into `AuthRestController`
- `AUTH_DI_CONST.IIdentityTokenRepo` — injected into `GetIdentityTokenUseCase`
- `DI.COGNITO_IDENTITY_DATASOURCE` — injected into `CognitoIdentityRepo`
- Composition: `src/modules/auth-api.module.ts` imports `CognitoIdentityDatasourceModule` + `AuthRestModule`

## Key Flow

1. `POST /auth/credential` → `AuthRestController.postCredential`.
2. Extracts access token from request via `getAccessTokenFromRequest`; throws `BadRequestError` if missing or not a valid JWT structure.
3. Validates token via `GetIdentityTokenRequestSchema.safeParse` (Zod); throws `ValidationError` on failure.
4. `GetIdentityTokenUseCase.execute(idToken)` → `CognitoIdentityRepo.getIdentityForUserPoolToken(idToken)` → Cognito Identity `GetId` / `GetCredentialsForIdentity`.

## Business Rules

- Requires a valid access token (JWT format) in cookie/header per `getAccessTokenFromRequest`.
- Returns federated Cognito identity credentials (`IdentityTokenResult`) for downstream AWS resource access.

## Known Patterns / Notes

- Wired via `auth-api.module.ts` + `RestApiRouter` (separate Lambda from `public-api`).
- Does **not** use `@ValidationArgs` decorator — validation is done manually in the controller with `safeParse`.
