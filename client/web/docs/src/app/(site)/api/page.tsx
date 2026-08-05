import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection, DocTable } from "@/components/docs/doc-section";
import {
  curlCreateItem,
  curlItemActivities,
  curlListItems,
  docsUserHeader,
} from "@/lib/docs-snippets";

const endpoints = [
  ["GET", "/health", "Service health — no auth"],
  ["GET", "/api/v1/items", "List items for the authenticated user"],
  ["GET", "/api/v1/items/:id", "Fetch a single item"],
  ["POST", "/api/v1/items", "Create an item (writes Create activity)"],
  ["PATCH", "/api/v1/items/:id", "Update an item (writes Update activity)"],
  ["GET", "/api/v1/items/:id/activities", "Append-only activity log for an item"],
  ["GET", "/api/v1/actors/me", "Ensure and return the person actor for the user"],
  ["GET", "/api/v1/actors/:id", "Fetch an actor by id"],
] as const;

export default function ApiReferencePage() {
  return (
    <>
      <DocPageHeader
        eyebrow="API reference"
        title="REST API"
        description="Stateless Express API backed by Postgres. All /api/v1 routes require a user identity header until full auth ships."
      />

      <div className="space-y-12">
        <DocSection id="auth" title="Authentication">
          <p>
            Pass <code className="text-foreground">X-Briefs-User-Id</code> on every request. In development the API
            falls back to <code className="text-foreground">BRIEFS_DEFAULT_USER_ID</code> from{" "}
            <code className="text-foreground">.env</code> when the header is omitted.
          </p>
          <CodeBlock
            title="Header"
            code={`X-Briefs-User-Id: ${docsUserHeader()}`}
          />
        </DocSection>

        <DocSection id="endpoints" title="Endpoints">
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Path</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {endpoints.map(([method, path, description]) => (
                <tr key={`${method}-${path}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-300">{method}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{path}</td>
                  <td className="px-4 py-2.5">{description}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </DocSection>

        <DocSection id="items" title="Items">
          <CodeBlock title="List" code={curlListItems()} />
          <CodeBlock title="Create" code={curlCreateItem()} />
          <p>
            Optional ingest dedupe on create: pass{" "}
            <code className="text-foreground">{`"source": { "system": "github", "externalId": "issue-18" }`}</code>.
            The database enforces uniqueness per user on{" "}
            <code className="text-foreground">(userId, source.system, source.externalId)</code>.
          </p>
        </DocSection>

        <DocSection id="activities" title="Activities">
          <CodeBlock title="List for item" code={curlItemActivities()} />
          <p>
            Activities are read-only via the API. They are written by the domain service on every item create or update.
          </p>
        </DocSection>

        <DocSection id="patch" title="Update body">
          <p>
            PATCH accepts partial updates — <code className="text-foreground">status</code>,{" "}
            <code className="text-foreground">name</code>, <code className="text-foreground">description</code>,{" "}
            <code className="text-foreground">tags</code>, <code className="text-foreground">lifecycle</code>, and
            more. Validated with <code className="text-foreground">itemUpdateInputSchema</code> from @briefs/shared.
          </p>
          <CodeBlock
            title="Example"
            code={`curl -H "X-Briefs-User-Id: ${docsUserHeader()}" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"in_progress"}' \\
  <api>/api/v1/items/<item-id>`}
          />
        </DocSection>
      </div>
    </>
  );
}
