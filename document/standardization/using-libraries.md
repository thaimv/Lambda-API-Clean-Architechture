# Using Libraries

Key dependencies from `package.json`. Versions reflect the current lockfile range (`^`).

> Note: `@aws-sdk/*` clients are also available in the Lambda runtime; this project bundles required SDK clients explicitly for version control.

---

## I. Production Dependencies

| Package                           | Version  | Purpose                                             |
| --------------------------------- | -------- | --------------------------------------------------- |
| `@aws-lambda-powertools/logger`   | ^2.8.0   | Structured logging (see [logging.md](./logging.md)) |
| `@prisma/client`                  | ^6.6.0   | Prisma ORM client — type-safe DB access             |
| `@prisma/extension-read-replicas` | ^0.4.1   | Read-replica routing for Prisma                     |
| `inversify`                       | ^6.0.2   | Dependency injection                                |
| `reflect-metadata`                | ^0.2.2   | Metadata for Inversify decorators                   |
| `zod`                             | ^3.23.8  | Request validation at controller boundary           |
| `dotenv`                          | ^16.4.5  | Local env loading only (not used in Lambda)         |
| `dayjs`                           | ^1.11.13 | Date/time utilities                                 |
| `axios`                           | ^1.15.1  | HTTP client                                         |
| `uuid`                            | ^11.1.0  | UUID generation                                     |
| `crypto-js`                       | ^4.2.0   | Crypto helpers                                      |
| `source-map-support`              | ^0.5.21  | Stack trace mapping for bundled code                |
| `path-to-regexp`                  | ^8.2.0   | REST path matching in router                        |

### AWS SDK (production)

Bundled for datasources in `src/common/datasources/`:

| Package                                              | Capability          |
| ---------------------------------------------------- | ------------------- |
| `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` | DynamoDB            |
| `@aws-sdk/client-s3` + `@aws-sdk/lib-storage`        | S3 / object storage |
| `@aws-sdk/client-lambda`                             | Lambda invoke       |
| `@aws-sdk/client-ses`                                | Email               |
| `@aws-sdk/client-sqs`                                | Message queue       |
| `@aws-sdk/client-sfn`                                | Step Functions      |
| `@aws-sdk/client-athena`                             | Athena              |
| `@aws-sdk/client-cloudwatch`                         | CloudWatch metrics  |
| `@aws-sdk/client-cognito-identity`                   | Cognito Identity    |
| `@aws-sdk/client-translate`                          | Translate           |
| `@aws-sdk/client-sns`                                | Push notifications  |
| `@aws-sdk/client-sts`                                | STS assume role     |

Other: `@dsnp/parquetjs`, `@google-cloud/storage`, `google-auth-library`, `file-type`, `jszip`.

---

## II. Dev Dependencies

| Package                                  | Version           | Purpose                                      |
| ---------------------------------------- | ----------------- | -------------------------------------------- |
| `typescript`                             | ^5.5.3            | TypeScript compiler                          |
| `prisma`                                 | ^6.6.0            | Prisma CLI — migrations, generate            |
| `prisma-json-types-generator`            | 3.2.3             | JSON field types in Prisma schema            |
| `vitest`                                 | ^2.0.5            | Unit / E2E test runner                       |
| `@vitest/coverage-v8`                    | ^2.0.5            | Coverage reporting                           |
| `esbuild` + `esbuild-plugin-tsc`         | ^0.23.0 / ^0.4.0  | Lambda bundling (`deploy/scripts/bundle.js`) |
| `eslint` + `@typescript-eslint/*`        | ^8.2.0            | Linting                                      |
| `prettier` + `eslint-config-prettier`    | ^3.3.3 / ^9.1.0   | Formatting                                   |
| `eslint-plugin-import`                   | ^2.29.1           | Import order lint                            |
| `husky` + `lint-staged`                  | ^9.1.4 / ^15.2.9  | Pre-commit hooks                             |
| `@aws-appsync/utils`                     | ^1.8.0            | AppSync resolver utilities (simulator)       |
| `@aws-sdk/client-secrets-manager`        | ^3.624.0          | Secrets Manager (dev/test tooling)           |
| `@faker-js/faker`                        | ^9.0.3            | Test fixtures                                |
| `aws-sdk-client-mock`                    | ^4.1.0            | AWS SDK mocking in tests                     |
| `@valkey/valkey-glide`                   | ^2.1.1            | Cache client (tests / local)                 |
| `tsx` / `ts-node`                        | ^4.16.2 / ^10.9.2 | Run TS scripts locally                       |
| `vite-tsconfig-paths`                    | ^5.0.1            | Path alias resolution in Vitest              |
| `tsconfig-paths`                         | ^4.2.0            | Path alias resolution in Node                |
| `cross-env`                              | ^7.0.3            | Cross-platform env vars in scripts           |
| `@types/node`, `@types/aws-lambda`, etc. | —                 | Type definitions                             |

---

## III. Usage Patterns

### Prisma (via datasource — not direct in use cases)

Repositories inject `DI.DB_CLIENT_DATASOURCE`; the datasource owns the Prisma client:

```typescript
const client = await this.dbClient.getClient();
return client.user.upsert({ where: { gigyaUuid }, update, create });
```

### Inversify DI

```typescript
import 'reflect-metadata'; // once at Lambda entry
import { inject, injectable } from 'inversify';

@injectable()
export class UsersUseCase {
  constructor(@inject(USERS_DI_CONST.IUsersRepo) private readonly usersRepo: IUsersRepo) {}
}
```

### Zod validation (controller boundary)

```typescript
export const createUserInfoDtoSchema = z.object({
  input: z.object({ userNickname: z.string().trim().min(1) }),
});
```

Applied via `@ValidationArgs(createUserInfoDtoSchema)` on controller methods.
