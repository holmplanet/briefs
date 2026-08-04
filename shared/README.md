# @briefs/shared

Shared types and the **Stitch** + **Brief** data contracts — single source of truth for `@briefs/system`
and clients.

## Layout

```
src/
  common/          shared Zod helpers
  stitch/
    constants.ts   version, status, priority
    schema.ts      entity schema + Stitch type
    inputs.ts      create/update input schemas
    store.ts       StitchStore interface
    index.ts       barrel export
  brief/
    constants.ts   version, kind
    schema.ts      entity schema + Brief types
    inputs.ts      generate input schema
    store.ts       BriefStore interface
    index.ts       barrel export
  index.ts         re-exports stitch + brief
```

Import from the package root or a domain subpath:

```ts
import { Stitch, stitchSchema } from "@briefs/shared";
import { BriefKind } from "@briefs/shared/brief";
```
