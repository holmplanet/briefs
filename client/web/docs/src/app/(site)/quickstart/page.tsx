import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection } from "@/components/docs/doc-section";
import {
  curlActorMe,
  curlCreateItem,
  curlHealth,
  curlListItems,
  docsApiBase,
} from "@/lib/docs-snippets";

export default function QuickstartPage() {
  const apiBase = docsApiBase();

  return (
    <>
      <DocPageHeader
        eyebrow="Quickstart"
        title="Run Briefs locally"
        description="Get the API and this docs site running in a few minutes. Uses npm workspaces — install with npm ci, never ad-hoc npm install in production pipelines."
      />

      <div className="space-y-12">
        <DocSection id="prerequisites" title="Prerequisites">
          <ul className="list-inside list-disc space-y-1 text-foreground/90">
            <li>Node.js 22+</li>
            <li>Docker (for Postgres)</li>
            <li>Repo cloned from holmplanet/briefs</li>
          </ul>
        </DocSection>

        <DocSection id="install" title="Install and start">
          <CodeBlock
            title="Terminal"
            code={`cd briefs
npm ci
cp .env.example .env
npm run db:up
npm run dev:system    # API — default http://localhost:8001
npm run dev:daily     # Briefs Daily — http://localhost:3000
npm run dev:docs      # SDK docs — http://localhost:3001`}
          />
        </DocSection>

        <DocSection id="env" title="Environment">
          <p>
            API config lives in <code className="text-foreground">.env</code> at the repo root. Web clients use{" "}
            <code className="text-foreground">.env.local</code> in their package directory:
          </p>
          <CodeBlock
            title="client/web/daily/.env.local"
            code={`NEXT_PUBLIC_API_URL=${apiBase}
NEXT_PUBLIC_USER_ID=demo
NEXT_PUBLIC_DOCS_URL=http://localhost:3001`}
          />
          <p>
            The API defaults to port <code className="text-foreground">8001</code> so it does not
            conflict with the Brief MCP server on <code className="text-foreground">8000</code>.
            Override with <code className="text-foreground">APP_PORT</code> in the repo root{" "}
            <code className="text-foreground">.env</code> and match{" "}
            <code className="text-foreground">NEXT_PUBLIC_API_URL</code> in your web client.
          </p>
        </DocSection>

        <DocSection id="verify" title="Verify the API">
          <p>
            From the repo root, run the CLI smoke test (starts against your local API on port{" "}
            <code className="text-foreground">8001</code>):
          </p>
          <CodeBlock title="Terminal" code="npm run briefs:smoke" />
          <p>Or verify individual endpoints with curl:</p>
          <CodeBlock title="Health" code={curlHealth()} />
          <CodeBlock title="List items" code={curlListItems()} />
          <CodeBlock title="Create an item" code={curlCreateItem()} />
          <CodeBlock title="Resolve your actor" code={curlActorMe()} />
        </DocSection>

        <DocSection id="daily" title="Briefs Daily">
          <p>
            Open{" "}
            <a
              href={process.env.NEXT_PUBLIC_DAILY_URL ?? "http://localhost:3000"}
              className="text-blue-300 hover:text-blue-200"
              target="_blank"
              rel="noreferrer"
            >
              Briefs Daily
            </a>{" "}
            to use the default web client — capture items, update status, and inspect activity logs
            against your local API.
          </p>
        </DocSection>
      </div>
    </>
  );
}
