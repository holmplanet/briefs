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
npm run dev:system    # API — default http://localhost:8000
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
            code={`NEXT_PUBLIC_BRIEFS_API_URL=${apiBase}
NEXT_PUBLIC_BRIEFS_USER_ID=demo
NEXT_PUBLIC_BRIEFS_DOCS_URL=http://localhost:3001`}
          />
          <p>
            If port 8000 is taken, start the API with{" "}
            <code className="text-foreground">BRIEFS_PORT=8001 npm run dev:system</code> and point{" "}
            <code className="text-foreground">NEXT_PUBLIC_BRIEFS_API_URL</code> at that port.
          </p>
        </DocSection>

        <DocSection id="verify" title="Verify the API">
          <CodeBlock title="Health" code={curlHealth()} />
          <CodeBlock title="List items" code={curlListItems()} />
          <CodeBlock title="Create an item" code={curlCreateItem()} />
          <CodeBlock title="Resolve your actor" code={curlActorMe()} />
        </DocSection>

        <DocSection id="daily" title="Briefs Daily">
          <p>
            Open{" "}
            <a
              href={process.env.NEXT_PUBLIC_BRIEFS_DAILY_URL ?? "http://localhost:3000"}
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
