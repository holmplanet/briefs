# @brief/shared

Shared types and the **TaskNode data contract** — single source of truth for `@brief/system`
and client packages.

- `task-node.ts` — Zod schema, input types, and `TaskNodeStore` interface

Depends on `zod` only. Grown as clients need more fields or vertical-specific extensions.
