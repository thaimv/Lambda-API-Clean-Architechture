# GraphQL API Implementation Workflow

## Module structure (LambdaAPI)

```
src/modules/[module]/
├── [module].const.ts                   # DI tokens (Symbol.for)
├── [module].graph.module.ts            # @Module for GraphQL controllers
├── controllers/
│   └── [module].graph.controller.ts    # @Route + @ValidationArgs
├── dtos/
│   ├── requests/[name].request.dto.ts  # Zod schema + inferred type
│   └── responses/[name].response.dto.ts
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

## Step 0: Read design + map

1. Read the detail design document fully.
2. Extract: field name (Query/Mutation), arguments, response shape, error codes, processing steps.
3. Identify target module folder (`src/modules/[module]/`). If new → create full skeleton.
4. Build a checklist covering 100% mapping from design to code.

---

## Step 1: RouteName enum

Add the new field to `src/common/constants/graphql-api.const.ts` → `RouteName`:

```ts
export enum RouteName {
  // ===== Query =====
  GET_MY_FEATURE = 'getMyFeature',

  // ===== Mutation =====
  CREATE_MY_FEATURE = 'createMyFeature',
}
```

- Query fields in `# ===== Query =====`, mutations in `# ===== Mutation =====`.

---

## Step 2: GraphQL schema (`src/presenter/graphql/schema.graphql`)

1. Add new types / input types.
2. Insert the new field in `type Query { }` or `type Mutation { }`.
3. Follow existing formatting conventions.

---

## Step 3: DI constants (`src/modules/[module]/[module].const.ts`)

```ts
export const MY_FEATURE_DI_CONST = {
  IMyFeatureRepo: Symbol.for('IMyFeatureRepo'),
  IMyFeatureUseCase: Symbol.for('IMyFeatureUseCase'),
};
```

---

## Step 4: Request DTO (`dtos/requests/[name].request.dto.ts`)

```ts
import { z } from 'zod';

export const myFeatureDtoSchema = z.object({
  input: z.object({
    fieldName: z.string().trim().min(1),
    // ... all fields with rules from design
  }),
});

export type MyFeatureRequest = z.infer<typeof myFeatureDtoSchema>;
```

Validation rules must exactly match the design document.

---

## Step 5: Response DTO (`dtos/responses/[name].response.dto.ts`)

```ts
export type MyFeatureResponse = {
  field1: string;
  field2: number | null;
};
```

Use a plain type or class matching the design's success response shape exactly.

---

## Step 6: Repository layer

**Interface** (`repos/[name].repo.ts`):

```ts
import type { User } from '@/common/models/user.model';
import type { TAuthUser } from '@/common/types/app.type';
import type { MyFeatureRequest } from '@/modules/[module]/dtos/requests/[name].request.dto';

export interface IMyFeatureRepo {
  saveMyFeature(params: MyFeatureRequest, authUser: TAuthUser): Promise<User>;
}
```

**Implementation** (`repos/implements/[name].repo.impl.ts`):

```ts
import { inject, injectable } from 'inversify';
import { DI } from '@/common/constants/di.const';
import type { DBClient } from '@/common/datasources/database/implements/prisma-db-client.datasource.impl';
import { logger } from '@/common/logger';

@injectable()
export class MyFeatureRepo implements IMyFeatureRepo {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: DBClient,
  ) {}

  async saveMyFeature(params: MyFeatureRequest, authUser: TAuthUser) {
    logger.debug('MyFeatureRepo.saveMyFeature', { userId: authUser.userId });
    const client = await this.dbClient.getClient();
    return await client.myTable.upsert({
      /* ... */
    });
  }
}
```

- Use Prisma client methods only. No raw SQL unless required by design.
- Use `$transaction` when multiple writes must be atomic.
- Map Prisma result → domain model before returning (never leak raw Prisma types).

---

## Step 7: Use-case layer

**Interface** (`usecases/[name].uc.ts`):

```ts
import type { TAuthUser } from '@/common/types/app.type';
import type { MyFeatureRequest } from '@/modules/[module]/dtos/requests/[name].request.dto';
import type { MyFeatureResponse } from '@/modules/[module]/dtos/responses/[name].response.dto';

export interface IMyFeatureUseCase {
  execute(data: MyFeatureRequest, authUser: TAuthUser): Promise<MyFeatureResponse>;
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

  async execute(data: MyFeatureRequest, authUser: TAuthUser): Promise<MyFeatureResponse> {
    const record = await this.repo.saveMyFeature(data, authUser);
    if (!record) throw new NotFoundError('Not found');
    return { field1: record.field1, field2: record.field2 };
  }
}
```

- Use case MUST NOT depend on `TRequestEvent` or any AWS-specific type.
- Use case orchestrates business logic and calls repos only.

---

## Step 8: Controller (`controllers/[module].graph.controller.ts`)

Add a new method (or create the controller if the module is new):

```ts
import { inject, injectable } from 'inversify';
import { RouteName } from '@/common/constants/graphql-api.const';
import { Route } from '@/common/decorators/route.decorator';
import { ValidationArgs } from '@/common/decorators/validation-args.decorator';
import type { TAuthUser } from '@/common/types/app.type';
import type { TRequestEvent } from '@/common/types/event.type';
import {
  myFeatureDtoSchema,
  type MyFeatureRequest,
} from '@/modules/[module]/dtos/requests/[name].request.dto';
import type { IMyFeatureUseCase } from '@/modules/[module]/usecases/[name].uc';
import { MY_FEATURE_DI_CONST } from '@/modules/[module]/[module].const';

@injectable()
export class MyModuleGraphController {
  constructor(
    @inject(MY_FEATURE_DI_CONST.IMyFeatureUseCase)
    private readonly myFeatureUseCase: IMyFeatureUseCase,
  ) {}

  @Route(RouteName.CREATE_MY_FEATURE)
  @ValidationArgs(myFeatureDtoSchema)
  async createMyFeature(
    event: TRequestEvent<MyFeatureRequest>,
    authUser: TAuthUser,
  ): Promise<MyFeatureResponse> {
    return this.myFeatureUseCase.execute(event.arguments, authUser);
  }
}
```

- `@Route(RouteName.X)` maps the AppSync `fieldName` to this method.
- `@ValidationArgs(schema)` validates Zod at the boundary.
- Controller MUST NOT contain business logic.

---

## Step 9: Module registration (`[module].graph.module.ts`)

```ts
import { Module } from '@/common/decorators/module.decorator';
import { MyModuleGraphController } from '@/modules/[module]/controllers/[module].graph.controller';
import { MyFeatureRepo } from '@/modules/[module]/repos/implements/[name].repo.impl';
import { MyFeatureUseCase } from '@/modules/[module]/usecases/implement/[name].uc.impl';
import { MY_FEATURE_DI_CONST } from '@/modules/[module]/[module].const';

@Module({
  controllers: [MyModuleGraphController],
  providers: [
    { provide: MY_FEATURE_DI_CONST.IMyFeatureRepo, useClass: MyFeatureRepo },
    { provide: MY_FEATURE_DI_CONST.IMyFeatureUseCase, useClass: MyFeatureUseCase },
  ],
})
export class MyModuleGraphModule {}
```

If the module is brand new, add it to the composition module:

```ts
// src/modules/appsync-api.module.ts
@Module({
  imports: [
    DatabaseDatasourceModule,
    DynamoDBDatasourceModule,
    ObjectStorageDatasourceModule,
    LambdaDatasourceModule,
    ApiGatewayDatasourceModule,
    PushNotificationDatasourceModule,
    CacheDatasourceModule,
    UsersGraphModule,
    MyModuleGraphModule, // ← add here
  ],
  providers: [{ provide: DI.APP_CONFIG, useClass: AppConfig }],
})
export class AppsyncApiModule {}
```

---

## Step 10: Unit tests (`tests/unit-test/modules/[module]/`)

Mirror the `src/` tree:

```
tests/unit-test/modules/[module]/
├── controllers/[module].graph.controller.test.ts
├── dtos/requests/[name].request.dto.test.ts
├── repos/[name].repo.impl.test.ts
└── usecases/[name].uc.impl.test.ts
```

Minimum test cases per unit:

- ✅ Valid input → expected success output
- ❌ Missing required field → `ValidationError`
- ❌ Invalid format / out-of-range → `ValidationError`
- ❌ Resource not found → `NotFoundError`
- ❌ Repository throws unexpected error → caught and re-thrown

---

## Step 11: Quality gates

Run and pass:

```bash
npm run test:ci
npm run lint
npm run build
```

Fix any failures before finalizing.

---

## Error handling

Errors propagate automatically through `GraphQLErrorHandlingPipe` in the Lambda pipeline.
Throw the appropriate class — no manual try/catch needed in controllers or use cases.

| Situation               | Error class           | `errorType` / `errorInfo` |
| ----------------------- | --------------------- | ------------------------- |
| Input validation fails  | `ValidationError`     | `EB-004`                  |
| Resource not found      | `NotFoundError`       | `EB-003`                  |
| Unauthenticated         | `UnauthorizedError`   | `EB-001`                  |
| Business rule violated  | `BadRequestError`     | `EB-002`                  |
| Resource already exists | `ExistedError`        | `EB-009`                  |
| Unexpected error        | `InternalServerError` | `ES-001`                  |

All error classes are in `src/common/errors/`.

---

## Layer communication

```
AppSync (schema.graphql + resolvers/invoke-request.ts)
     │  field + arguments + identity
     ▼
GraphQLRouter.invoke(event)         [src/config/routes/graph-ql-router.ts]
     │  matches RouteName → controller method
     ▼
Controller method                   [controllers/[module].graph.controller.ts]
     │  @Route + @ValidationArgs (Zod)
     │  extracts TAuthUser from identity
     ▼
UseCase.execute(dto, authUser)      [usecases/implement/[name].uc.impl.ts]
     │  business logic
     ▼
Repo.method(...)                    [repos/implements/[name].repo.impl.ts]
     │  Prisma queries
     ▼
Aurora PostgreSQL (via Prisma)
```

---

## Output checklist

- [ ] `RouteName` enum updated in `src/common/constants/graphql-api.const.ts`
- [ ] GraphQL schema updated in `src/presenter/graphql/schema.graphql` (types + entry)
- [ ] DI tokens added in `[module].const.ts`
- [ ] Request DTO with Zod schema matching all design validation rules
- [ ] Response DTO/type matching design success response shape
- [ ] Repository interface + implementation
- [ ] Use-case interface + implementation
- [ ] Controller method with `@Route` and `@ValidationArgs`
- [ ] Module registered; composition module updated if new
- [ ] Unit tests: DTO, repo, use-case, controller
- [ ] All validation rules enforced
- [ ] Error classes used correctly (no raw `new Error(...)`)
- [ ] Structured logs at controller entry, repo call, success, error
- [ ] No sensitive data logged
- [ ] `npm run test:ci` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No dead code, no TODO left
