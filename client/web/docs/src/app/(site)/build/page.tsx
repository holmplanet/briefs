import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection } from "@/components/docs/doc-section";

export default function BuildPage() {
  return (
    <>
      <DocPageHeader
        eyebrow="Build"
        title="Ship a web client"
        description="Web clients share @briefs/web-shared for UI and theme. Each client is a Next.js app in client/web/ that calls the same System API."
      />

      <div className="space-y-12">
        <DocSection id="scaffold" title="Workspace setup">
          <p>Add the client to root <code className="text-foreground">package.json</code> workspaces:</p>
          <CodeBlock
            title="package.json"
            code={`"workspaces": [
  "shared",
  "system",
  "client/web/shared",
  "client/web/docs",
  "client/web/daily",
  "client/web/example"
]`}
          />
        </DocSection>

        <DocSection id="deps" title="Client package.json">
          <CodeBlock
            title="client/web/example/package.json"
            code={`{
  "name": "@briefs/example",
  "dependencies": {
    "@briefs/shared": "*",
    "@briefs/web-shared": "*",
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  }
}`}
          />
        </DocSection>

        <DocSection id="next-config" title="Next.js config">
          <CodeBlock
            title="next.config.ts"
            code={`import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@briefs/shared", "@briefs/web-shared"],
};

export default nextConfig;`}
          />
        </DocSection>

        <DocSection id="theme" title="Theme">
          <p>Import the shared theme from your client&apos;s globals.css:</p>
          <CodeBlock
            title="globals.css"
            code={`@import "tailwindcss";
@source "../../../shared/src/**/*.{js,ts,jsx,tsx}";
@import "../../../shared/src/styles/theme.css";`}
          />
          <p>
            Use <code className="text-foreground">AppShell</code>,{" "}
            <code className="text-foreground">SkyBackground</code>, and UI primitives from the package:
          </p>
          <CodeBlock
            title="page.tsx"
            code={`import { AppShell, Button, SkyBackground, cn } from "@briefs/web-shared";`}
          />
        </DocSection>

        <DocSection id="api-client" title="API client">
          <p>
            Each client owns its API client module (see{" "}
            <code className="text-foreground">client/web/daily/src/lib/briefs-api.ts</code>). Server components and
            server actions call the REST API with <code className="text-foreground">X-Briefs-User-Id</code> — avoid
            browser-side fetches unless you add CORS to the API.
          </p>
        </DocSection>

        <DocSection id="reference" title="Reference apps">
          <p>
            <code className="text-foreground">@briefs/daily</code> is the reference client and <code className="text-foreground">@briefs/docs</code>{" "}
            (this site) documents the platform. New clients should follow the same pattern: shared UI, an owned API
            client, and client-specific pages.
          </p>
        </DocSection>
      </div>
    </>
  );
}
