# {ModuleName}

> Loaded when reviewing or developing code that touches this module.

## Overview

- **Tier**: feature | integration | infrastructure | app
- **Purpose**: {one-line description}
- **Dependencies**: {list major internal/external dependencies}

## Folder Structure

```
src/modules/{module-name}/
├── {module}.const.ts                 # DI tokens (Symbol.for)
├── {module}.rest.module.ts           # @Module for REST controller(s) (if any)
├── {module}.graph.module.ts          # @Module for GraphQL controller(s) (if any)
├── controllers/                      # Controllers (decorators + validation, no business logic)
├── usecases/                         # Interfaces + implements/ (business logic orchestration)
├── repos/                            # Repository interfaces + implements/
└── dtos/                             # requests/ and responses/ DTOs + Zod schemas
```

> Unit tests live outside the module, under `tests/unit-test/modules/{module-name}/` (mirroring `src/`).

## Cross-Module Interfaces

**Consumes**: {shared contracts from src/common or other module interfaces via DI}

**Multi-inject**: {if any multi-provider pattern exists; otherwise `none`}

**Exposes**: {use case / repository interfaces provided for other modules}

## Business Rules

- {Key rule 1}
- {Key rule 2}

## Known Patterns / Notes

- {Any module-specific patterns, quirks, or tech debt}
