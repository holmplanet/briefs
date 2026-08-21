import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection, DocTable } from "@/components/docs/doc-section";

const dailySourceUrl = "https://github.com/holmplanet/briefs/tree/main/client/web/daily";

export default function DailyPage() {
  return (
    <>
      <DocPageHeader
        eyebrow="Briefs Daily"
        title="The reference web client"
        description="Briefs Daily is a read-focused Next.js client for viewing items, statuses, and activity history. Work is captured and updated through MCP, while Daily gives people a clear place to review what changed."
      />

      <div className="space-y-12">
        <DocSection id="role" title="What Daily does">
          <p>
            Daily is the reference client in <code className="text-foreground">client/web/daily</code>. It shows
            the current item projection and append-only activity history from the Briefs System API. The default
            workflow is assistant-first: create or update work through MCP, then use Daily to review the result.
          </p>
          <p>
            The <code className="text-foreground">/briefs/new</code> questionnaire is the deliberate human-intake
            exception. It creates an item through the same System API and activity contract used by the other clients.
          </p>
          <a href={dailySourceUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
            Browse the Briefs Daily code on GitHub
          </a>
        </DocSection>

        <DocSection id="daily-driver" title="A daily driver for durable work">
          <p>
            Daily is meant to be the place a person returns to throughout the day. It turns assistant and automation
            activity into a calm, human-readable work surface: what is open, what changed, what needs attention, and
            which actor made the change.
          </p>
          <p>
            The conversation is where work is captured. Daily is where the resulting work is reviewed. That split keeps
            assistants fast and natural while giving people a stable view that does not disappear when a chat ends.
          </p>
          <CodeBlock
            title="Typical day"
            code={`1. Ask an assistant to capture a task or note.
2. The assistant writes an Item through MCP.
3. Open Daily to review the current work queue.
4. Inspect an item's Activity history when context matters.
5. Ask the assistant to update status or details as work moves forward.`}
          />
        </DocSection>

        <DocSection id="repo" title="Where Daily fits in the repository">
          <p>
            Daily is a reference implementation, not a separate product model. It is intentionally thin: the System
            API owns persistence, <code className="text-foreground">@briefs/shared</code> owns the schemas, and MCP
            owns the assistant-facing write tools.
          </p>
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Repository area</th>
                <th className="px-4 py-2.5 font-medium">Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["client/web/daily", "The daily-driver web experience and auth/session boundary."],
                ["client/mcp", "Assistant-facing tools for creating, updating, and reading work."],
                ["system", "REST API, persistence, actor resolution, and activity history."],
                ["shared", "The Item, Actor, Activity, and input schemas shared by every client."],
              ].map(([area, responsibility]) => (
                <tr key={area}>
                  <td className="px-4 py-2.5 font-mono text-xs">{area}</td>
                  <td className="px-4 py-2.5">{responsibility}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </DocSection>

        <DocSection id="local" title="Run it locally">
          <p>From the repository root, start the System API and Daily together:</p>
          <CodeBlock
            title="Terminal"
            code={"npm ci\nnpm run dev:system    # API — http://localhost:8001\nnpm run dev:daily     # Daily — http://localhost:3000"}
          />
          <p>
            Copy <code className="text-foreground">client/web/daily/.env.example</code> to{" "}
            <code className="text-foreground">.env.local</code> in the Daily package. Without{" "}
            <code className="text-foreground">OAUTH_ISSUER</code>, a non-production process can use the development
            identity configured by <code className="text-foreground">DEV_USER_ID</code>.
          </p>
        </DocSection>

        <DocSection id="environment" title="Environment variables">
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Variable</th>
                <th className="px-4 py-2.5 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["NEXT_PUBLIC_API_URL", "System API base URL used by the client."],
                ["NEXT_PUBLIC_MCP_URL", "MCP endpoint shown in the Connect flow."],
                ["NEXT_PUBLIC_DOCS_URL", "Link back to the SDK documentation site."],
                ["APP_URL", "Daily origin used to construct the OAuth callback URL."],
                ["OAUTH_ISSUER", "OAuth/OIDC issuer used for production sign-in."],
                ["OAUTH_CLIENT_ID", "OAuth client registration identifier."],
                ["SESSION_SECRET", "Secret used to sign the Daily session cookie."],
                ["AUTH_SECRET", "Secret required by production authentication flows."],
                ["DEV_USER_ID", "Local development identity when OAuth is disabled."],
              ].map(([name, purpose]) => (
                <tr key={name}>
                  <td className="px-4 py-2.5 font-mono text-xs">{name}</td>
                  <td className="px-4 py-2.5">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </DocSection>

        <DocSection id="auth" title="Authentication">
          <p>
            Production Daily uses OAuth 2.1 with PKCE and an email-capable OAuth provider. The provider decides which
            email addresses are allowed to authenticate; Daily receives the resulting identity and stores a signed
            session. Configure the callback as:
          </p>
          <CodeBlock title="OAuth callback" code="https://your-daily-host.example/auth/callback" />
          <p>
            Daily forwards the session&apos;s bearer token to the System API and MCP. When the token is missing or
            rejected, the client treats the session as unauthenticated and asks the user to sign in again. Production
            also requires <code className="text-foreground">OAUTH_ISSUER</code>,{" "}
            <code className="text-foreground">AUTH_SECRET</code>, and a non-default{" "}
            <code className="text-foreground">SESSION_SECRET</code>.
          </p>
        </DocSection>

        <DocSection id="api" title="How it connects">
          <p>
            Server components and actions call the System API. With OAuth enabled, requests use the session bearer
            token; local development can use the configured development identity instead.
          </p>
          <CodeBlock title="Authenticated API request" code={"GET /api/v1/items\nAuthorization: Bearer <access-token>"} />
          <p>
            Daily does not need to be hosted for the platform to work. Run it locally, replace it with another client,
            or use the source as a starting point for a custom web experience.
          </p>
        </DocSection>

        <DocSection id="extend" title="Customize or replace it">
          <p>
            To build another client, keep the contracts stable and choose your own presentation layer. Reuse{" "}
            <code className="text-foreground">@briefs/shared</code> for schemas and{" "}
            <code className="text-foreground">@briefs/web-shared</code> for UI primitives, then give the new client
            its own API adapter and environment configuration.
          </p>
          <p>
            See <Link href="/build" className="text-blue-300 hover:text-blue-200">Build a client</Link> for the
            shared Next.js structure and <Link href="/quickstart" className="text-blue-300 hover:text-blue-200">Quickstart</Link>{" "}
            for the complete local setup.
          </p>
        </DocSection>
      </div>
    </>
  );
}
