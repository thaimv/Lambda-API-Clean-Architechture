# REST API Implementation Workflow

## Module structure (LambdaAPI)

```
src/modules/[module]/
├── [module].const.ts                   # DI tokens (Symbol.for)
├── [module].rest.module.ts             # @Module for REST controllers
├── controllers/
│   └── [module].rest.controller.ts     # @Get/@Post/@Put/@Patch/@Delete
├── dtos/
│   └── requests/[name].request.dto.ts  # Zod schema + inferred type
├── repos/                              # NOT repo/
│   ├── [name].repo.ts                  # Interface
│   └── implements/
│       └── [name].repo.impl.ts
└── usecases/
    ├── [name].uc.ts                    # Interface
    └── implement/                      # NOT implements/
        └── [name].uc.impl.ts
```

Unit tests live **outside** the module under `tests/unit-test/modules/[module]/` mirroring `src/`.

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Confirm detail design document path exists and is readable; confirm it matches `manifest.yaml` → `input`.
3. If input is missing, ambiguous, or invalid → **stop and ask** before continuing.

---

## Step 2: Read design + map

1. Read the detail design document fully.
2. Extract: HTTP method, URL path, path/query/body params, response shape, error codes, processing steps.
3. Identify target module folder (`src/modules/[module]/`). If new → create full skeleton.
4. Build a checklist covering 100% mapping from design to code.

---

## Step 1: Path constant (`src/common/constants/rest-api.const.ts`)

Add the new endpoint path to the matching `Path{Domain}Api` enum (or create one if the domain is new):

```ts
export enum PathPublicApi {
  GetCurrentUser = '/user',
  GetMyResource = '/my_resources/:resource_id', // ← add here
}
```

Rules:

- Path parameters use `:param_name` syntax (path-to-regexp format).
- Keep paths in snake_case to match REST convention.
- Do NOT modify or remove existing entries.

---

## Step 2: DI constants (`src/modules/[module]/[module].const.ts`)

```ts
export const MY_FEATURE_DI_CONST = {
  IMyFeatureRepo: Symbol.for('IMyFeatureRepo'),
  IMyFeatureUseCase: Symbol.for('IMyFeatureUseCase'),
};
```

---

## Step 3: Request DTO (`dtos/requests/[name].request.dto.ts`)

```ts
import { z } from 'zod';

export const myFeatureDtoSchema = z.object({
  // path params
  resource_id: z.string().trim().uuid(),
  // query params — use z.coerce for numbers coming as strings
  offset: z.coerce.number().int().min(0).optional().nullable().default(null),
  limit: z.coerce.number().int().min(1).max(100).optional().nullable().default(null),
  // body fields
  name: z.string().trim().max(50),
});

export type MyFeatureDto = z.infer<typeof myFeatureDtoSchema>;
```

Rules:

- Path/query params arrive as strings from API Gateway → use `z.coerce` for numeric/boolean fields.
- Validation rules must exactly match the design document.

---

## Step 4: Repository layer

**Interface** (`repos/[name].repo.ts`):

```ts
import type { TAuthUser } from '@/common/types/app.type';
import type { MyFeatureModel } from '@/modules/[module]/models/[name].model';

export interface IMyFeatureRepo {
  findAll(userId: string): Promise<MyFeatureModel[]>;
  findById(id: string, userId: string): Promise<MyFeatureModel | null>;
}
```

**Implementation** (`repos/implements/[name].repo.impl.ts`):

```ts
import { inject, injectable } from 'inversify';
import { DI } from '@/common/constants/di.const';
import type { PrismaDBClientDatasource } from '@/common/datasources/database/implements/prisma-db-client.datasource.impl';
import { logger } from '@/common/logger';

@injectable()
export class MyFeatureRepo implements IMyFeatureRepo {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: PrismaDBClientDatasource,
  ) {}

  async findAll(userId: string): Promise<MyFeatureModel[]> {
    logger.debug('MyFeatureRepo.findAll', { userId });
    const client = await this.dbClient.getClient();
    const rows = await client.myTable.findMany({
      where: { cognitoSub: userId },
      orderBy: { createDatetime: 'desc' },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.createDatetime }));
  }
}
```

- Use Prisma client methods only. No raw SQL unless required by design.
- Use `$transaction` when multiple writes must be atomic.
- Map Prisma rows → domain model before returning (never leak raw Prisma types).

---

## Step 5: Use-case layer

**Interface** (`usecases/[name].uc.ts`):

```ts
import type { TAuthUser } from '@/common/types/app.type';
import type { MyFeatureDto } from '@/modules/[module]/dtos/requests/[name].request.dto';
import type { MyFeatureModel } from '@/modules/[module]/models/[name].model';

export interface IMyFeatureUseCase {
  getAll(params: MyFeatureDto, authUser: TAuthUser): Promise<MyFeatureModel[]>;
}
```

**Implementation** (`usecases/implement/[name].uc.impl.ts`):

```ts
import { inject, injectable } from 'inversify';
import { NotFoundError } from '@/common/errors/notfound-error';

@injectable()
export class MyFeatureUseCase implements IMyFeatureUseCase {
  constructor(
    @inject(MY_FEATURE_DI_CONST.IMyFeatureRepo)
    private readonly repo: IMyFeatureRepo,
  ) {}

  async getAll(params: MyFeatureDto, authUser: TAuthUser): Promise<MyFeatureModel[]> {
    const result = await this.repo.findAll(authUser.userId);
    if (!result.length) throw new NotFoundError('Not found');
    return result;
  }
}
```

- Use case MUST NOT depend on `APIGatewayProxyEvent` or any AWS-specific type.
- Orchestrates domain logic and calls repos only.

---

## Step 6: Controller (`controllers/[module].rest.controller.ts`)

```ts
import { inject, injectable } from 'inversify';
import { Get, Post, Put, Patch, Delete } from '@/common/decorators/rest-api-route.decorator';
import { PathPublicApi } from '@/common/constants/rest-api.const';
import { SuccessResponse } from '@/common/responses/api-success-response';
import { myFeatureDtoSchema } from '@/modules/[module]/dtos/requests/[name].request.dto';
import { MY_FEATURE_DI_CONST } from '@/modules/[module]/[module].const';
import type { IMyFeatureUseCase } from '@/modules/[module]/usecases/[name].uc';
import { logger } from '@/common/logger';

@injectable()
export class MyModuleRestController {
  constructor(
    @inject(MY_FEATURE_DI_CONST.IMyFeatureUseCase)
    private readonly myFeatureUseCase: IMyFeatureUseCase,
  ) {}

  @Get(PathPublicApi.GetMyResource)
  async getMyResource(event: any) {
    const params = myFeatureDtoSchema.parse({
      resource_id: event.pathParameters?.resource_id,
      offset: event.queryStringParameters?.offset,
    });
    logger.debug('getMyResource', { resource_id: params.resource_id });
    const result = await this.myFeatureUseCase.getAll(params, event.authUser);
    return SuccessResponse.create(result);
  }

  @Post(PathPublicApi.CreateMyResource)
  async createMyResource(event: any) {
    const body = JSON.parse(event.body ?? '{}');
    const params = myFeatureDtoSchema.parse({
      resource_id: event.pathParameters?.resource_id,
      ...body,
    });
    const result = await this.myFeatureUseCase.create(params, event.authUser);
    return SuccessResponse.create(result);
  }
}
```

Decorator → HTTP method mapping:

| HTTP   | Decorator       |
| ------ | --------------- |
| GET    | `@Get(path)`    |
| POST   | `@Post(path)`   |
| PUT    | `@Put(path)`    |
| PATCH  | `@Patch(path)`  |
| DELETE | `@Delete(path)` |

Rules:

- Parse **all** params inside the controller method (path + query + body merged into one Zod parse call).
- `event.authUser` carries `{ userId, username }` injected by the router.
- Always return `SuccessResponse.create(data)` — wraps payload in standard format.
- Controller MUST NOT contain business logic.

---

## Step 7: Module registration (`[module].rest.module.ts`)

```ts
import { Module } from '@/common/decorators/module.decorator';
import { MyModuleRestController } from '@/modules/[module]/controllers/[module].rest.controller';
import { MyFeatureRepo } from '@/modules/[module]/repos/implements/[name].repo.impl';
import { MyFeatureUseCase } from '@/modules/[module]/usecases/implement/[name].uc.impl';
import { MY_FEATURE_DI_CONST } from '@/modules/[module]/[module].const';

@Module({
  controllers: [MyModuleRestController],
  providers: [
    { provide: MY_FEATURE_DI_CONST.IMyFeatureRepo, useClass: MyFeatureRepo },
    { provide: MY_FEATURE_DI_CONST.IMyFeatureUseCase, useClass: MyFeatureUseCase },
  ],
})
export class MyModuleRestModule {}
```

If adding to an existing Lambda, import the new module in the composition module:

```ts
// src/modules/public-api.module.ts
// Only import the datasource modules that this Lambda actually needs.
// The existing module uses CommonUserRepo (Prisma). Add only what the new module requires.
@Module({
  imports: [
    CommonUserRepo, // shared Prisma repo wiring — already present
    UserRestModule, // existing
    MyModuleRestModule, // ← add here
  ],
  providers: [{ provide: DI.APP_CONFIG, useClass: AppConfig }],
})
export class PublicApiModule {}
```

---

## Step 8: Lambda entry point (only for a brand-new Lambda)

> Skip this step if the endpoint is added to an existing Lambda.

**`src/modules/[name]-rest-api.module.ts`**

```ts
import { Module } from '@/common/decorators/module.decorator';
import { AppConfig } from '@/config/app.config';
import { DatabaseDatasourceModule } from '@/config/di/datasources/database.di';
import { DI } from '@/common/constants/di.const';
import { MyModule } from '@/modules/[module]/[module].rest.module';

@Module({
  imports: [DatabaseDatasourceModule, MyModule],
  providers: [{ provide: DI.APP_CONFIG, useClass: AppConfig }],
})
export class MyRestApiModule {}
```

**`src/presenter/lambdas/[name]-rest-api.ts`**

```ts
import type { APIGatewayProxyHandler } from 'aws-lambda';
import 'reflect-metadata';
import 'source-map-support/register';
import { Lambda } from '@/common/lambda/lambda';
import { bootstrapApplication } from '@/config/di/di.config';
import { RestApiRouter } from '@/config/routes/rest-api-router';
import { MyRestApiModule } from '@/modules/[name]-rest-api.module';

const router = new RestApiRouter(true);
bootstrapApplication(MyRestApiModule, router);

export const handler: APIGatewayProxyHandler = new Lambda((event, _context) =>
  router.invoke(event),
).createHandler();
```

---

## Step 9: Quality gates

```bash
npm run lint
npm run build
```

Fix any failures before finalizing.

---

## Error handling

Errors are handled centrally by `ErrorHandlingPipe` (wraps `createApiLoggingPipe()` + error serialization). Throw the appropriate class — do NOT manually build error JSON.

| Situation               | Error class           | HTTP |
| ----------------------- | --------------------- | ---- |
| Input validation fails  | `ValidationError`     | 400  |
| Resource not found      | `NotFoundError`       | 404  |
| Unauthenticated         | `UnauthorizedError`   | 401  |
| Business rule violated  | `BadRequestError`     | 400  |
| Resource already exists | `ExistedError`        | 400  |
| Unexpected error        | `InternalServerError` | 500  |

All error classes are in `src/common/errors/`.

---

## Layer communication

```
API Gateway
     │  HTTPMethod + path + headers + body
     ▼
Lambda.createHandler()              [src/common/lambda/lambda.ts]
     │  createApiLoggingPipe() → ErrorHandlingPipe → RestApiRouter.invoke()
     ▼
RestApiRouter.invoke(event)         [src/config/routes/rest-api-router.ts]
     │  matches method + path → controller method
     │  injects authUser from Cognito identity
     ▼
Controller method                   [controllers/[module].rest.controller.ts]
     │  @Get/@Post/... + Zod.parse(params)
     ▼
UseCase.method(dto, authUser)       [usecases/implement/[name].uc.impl.ts]
     │  business logic
     ▼
Repo.method(...)                    [repos/implements/[name].repo.impl.ts]
     │  Prisma queries
     ▼
Aurora PostgreSQL (via Prisma)
```

---

## Output checklist

- [ ] Path constant added to `src/common/constants/rest-api.const.ts`
- [ ] DI tokens added in `[module].const.ts`
- [ ] Request DTO with Zod schema matching all design validation rules
- [ ] Repository interface + implementation
- [ ] Use-case interface + implementation
- [ ] Controller method with correct HTTP decorator + Zod parse
- [ ] Module updated with all new provider registrations
- [ ] Composition module updated (or new Lambda entry created if new Lambda)
- [ ] All validation rules enforced
- [ ] Error classes used correctly
- [ ] Structured logs at controller entry, repo call, success, error
- [ ] No sensitive data logged
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No dead code, no TODO left

| Check            | Pass when                          |
| ---------------- | ---------------------------------- |
| Output checklist | All items checked                  |
| `npm run lint`   | Passes                             |
| `npm run build`  | Passes                             |
| Output contract  | Matches `manifest.yaml` → `output` |

Report output paths and any checklist items still open. Suggest `manifest.yaml` → `next_skill` when complete.
