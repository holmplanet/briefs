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
                <th className="px-4 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["name", "Display title"],
                ["kind", "Vertical type — task, note, etc."],
                ["status", "open | in_progress | done | cancelled"],
                ["ownerActorId", "Person actor who owns the item"],
                ["context / originContext", "Vertical scope — default core"],
                ["lifecycle", "active | archived"],
                ["occurredAt", "When it happened in the world"],
                ["source", "Optional ingest key — system + externalId"],
              ].map(([field, notes]) => (
                <tr key={field}>
                  <td className="px-4 py-2.5 font-mono text-xs">{field}</td>
                  <td className="px-4 py-2.5">{notes}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </DocSection>

        <DocSection id="activity" title="Activity">
          <p>
            Append-only records keyed by <code className="text-foreground">itemId</code>. Standard verbs include{" "}
            <code className="text-foreground">Create</code> and <code className="text-foreground">Update</code>.
            Updates carry structured deltas:
          </p>
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
            Person actors are ensured on first API use via <code className="text-foreground">GET /actors/me</code>.
            Service actors represent integrations. Every activity records an <code className="text-foreground">actorId</code>.
          </p>
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
