import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection, DocTable } from "@/components/docs/doc-section";

export default function SchemasPage() {
  return (
    <>
      <DocPageHeader
        eyebrow="Schemas"
        title="@briefs/shared"
        description="Single source of truth for items, actors, and activities. Import Zod schemas for validation on clients, scripts, and assistant tools."
      />

      <div className="space-y-12">
        <DocSection id="imports" title="Imports">
          <CodeBlock
            title="TypeScript"
            code={`import {
  Item,
  itemSchema,
  itemCreateInputSchema,
  itemUpdateInputSchema,
  ItemStatus,
} from "@briefs/shared/item";

import { Activity, ActivityType } from "@briefs/shared/activity";
import { Actor } from "@briefs/shared/actor";`}
          />
        </DocSection>

        <DocSection id="item" title="Item (schema v4)">
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Field</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["schemaVersion", "4", "Schema version"],
                ["id", "UUID", "Stable item identity"],
                ["userId", "string", "Owning user identity"],
                ["name", "string", "Display title"],
                ["status", "enum", "open | in_progress | done | cancelled"],
                ["dueAt", "ISO datetime?", "Optional deadline"],
                ["scheduledAt", "ISO datetime?", "Optional planned time"],
                ["completedAt", "ISO datetime?", "Optional completion time"],
                ["priority", "enum?", "low | normal | high | urgent"],
                ["description", "string?", "Markdown-formatted body for humans and agents"],
                ["kind", "string", "Item type — task, note, ingest, etc."],
                ["ownerActorId", "UUID", "Actor who owns the item"],
                ["context", "string", "Domain scope — defaults to core"],
                ["originContext", "string", "Original domain scope — defaults to core"],
                ["tags", "string[]?", "Optional labels"],
                ["refs", "ItemRef[]?", "Typed links to other items"],
                ["lifecycle", "enum", "active | archived"],
                ["source", "ItemSource?", "External provenance: system, externalId, optional externalUrl"],
                ["ingestedAt", "ISO datetime?", "When Briefs first ingested the item"],
                ["state", "Record<string, unknown>?", "Optional domain-specific state"],
                ["occurredAt", "ISO datetime", "When it happened in the world"],
                ["createdAt", "ISO datetime", "When the item was created"],
                ["updatedAt", "ISO datetime", "When the item was last updated"],
              ].map(([field, type, notes]) => (
                <tr key={field}>
                  <td className="px-4 py-2.5 font-mono text-xs">{field}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{type}</td>
                  <td className="px-4 py-2.5">{notes}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </DocSection>

        <DocSection id="activity" title="Activity">
          <p>
            Activities are append-only records keyed by <code className="text-foreground">itemId</code>. They record
            who acted, what happened, when it happened, and when Briefs recorded it. Standard verbs include{" "}
            <code className="text-foreground">Create</code>, <code className="text-foreground">Update</code>,{" "}
            <code className="text-foreground">Move</code>, <code className="text-foreground">Accept</code>,{" "}
            <code className="text-foreground">Reject</code>, <code className="text-foreground">Undo</code>,{" "}
            <code className="text-foreground">Delete</code>, and <code className="text-foreground">Merge</code>.
          </p>
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Field</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["schemaVersion", "1", "Schema version"],
                ["id", "UUID", "Stable activity identity"],
                ["type", "string", "Capitalized verb; namespaced verbs may use domain:Verb"],
                ["actorId", "UUID", "Actor who performed the action"],
                ["itemId", "UUID", "Item this activity applies to"],
                ["origin", "string?", "Origin system or workflow"],
                ["target", "string?", "Target of the action"],
                ["summary", "string?", "Human-readable explanation; required for some verbs"],
                ["occurredAt", "ISO datetime", "When the action happened in the world"],
                ["recordedAt", "ISO datetime", "When Briefs recorded the action"],
                ["result", "ActivityResult?", "Created item or field-level changes"],
                ["clientKey", "string?", "Client-supplied idempotency key"],
              ].map(([field, type, notes]) => (
                <tr key={field}>
                  <td className="px-4 py-2.5 font-mono text-xs">{field}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{type}</td>
                  <td className="px-4 py-2.5">{notes}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
          <p>Updates carry structured deltas in <code className="text-foreground">result.changes</code>:</p>
          <CodeBlock
            title="result.changes"
            code={`{
  "result": {
    "changes": [
      { "field": "status", "before": "open", "after": "in_progress" }
    ]
  }
}`}
          />
        </DocSection>

        <DocSection id="actor" title="Actor">
          <p>
            Actors identify the people and software that act on work. Person actors are ensured on first API use via{" "}
            <code className="text-foreground">GET /actors/me</code>; Service and Application actors represent
            integrations and software clients. Every activity records an <code className="text-foreground">actorId</code>.
          </p>
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Field</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["schemaVersion", "1", "Schema version"],
                ["id", "UUID", "Stable actor identity"],
                ["type", "enum", "Person | Service | Application"],
                ["name", "string", "Display name"],
                ["identity", "string", "SSO principal, service principal, or application identity"],
                ["createdAt", "ISO datetime", "When the actor was created"],
              ].map(([field, type, notes]) => (
                <tr key={field}>
                  <td className="px-4 py-2.5 font-mono text-xs">{field}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{type}</td>
                  <td className="px-4 py-2.5">{notes}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </DocSection>

        <DocSection id="layout" title="Source layout">
          <CodeBlock
            title="shared/src/"
            code={`actor/           who acted
activity/        append-only event log
item/            durable item + ingest source
common/          shared Zod helpers`}
          />
        </DocSection>
      </div>
    </>
  );
}
