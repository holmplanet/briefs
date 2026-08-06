import Link from "next/link";
import { Plug, Terminal } from "lucide-react";

const mcpUrl = process.env.NEXT_PUBLIC_BRIEFS_MCP_URL ?? "http://localhost:3333/mcp";

export function McpConnectPanel({ className }: { className?: string }) {
  const cursorConfig = `{
  "mcpServers": {
    "briefs": {
      "url": "${mcpUrl}"
    }
  }
}`;

  return (
    <section className={className}>
      <div className="glass-panel space-y-5 rounded-3xl p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
            <Plug className="size-4 text-blue-200" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-medium tracking-[-0.01em]">Work through MCP</h2>
            <p className="text-sm text-muted-foreground">
              Briefs Daily is read-only. Create tasks, update status, and capture work from your
              assistant via the Briefs MCP server — authenticated with the same OAuth identity as
              this app.
            </p>
          </div>
        </div>

        <ol className="space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1. Connect in Cursor</span> — add the MCP
            server URL below. OAuth will prompt for email OTP (mcp-oauth-stack).
          </li>
          <li>
            <span className="font-medium text-foreground">2. Ask your assistant</span> — e.g.
            &quot;create a task to ship the auth flow&quot; or &quot;mark my open items done.&quot;
          </li>
          <li>
            <span className="font-medium text-foreground">3. Refresh Daily</span> — changes appear
            here with the full activity log.
          </li>
        </ol>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Terminal className="size-3.5" />
            Cursor MCP config
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-border/60 bg-background/50 p-4 text-xs leading-relaxed text-foreground/90">
            {cursorConfig}
          </pre>
        </div>

        <p className="text-xs text-muted-foreground">
          MCP URL:{" "}
          <code className="rounded-full bg-background/60 px-2 py-0.5 text-foreground">{mcpUrl}</code>
          . See{" "}
          <a
            href="https://github.com/holmplanet/mcp-oauth-stack"
            className="text-blue-300 hover:text-blue-200"
            target="_blank"
            rel="noreferrer"
          >
            mcp-oauth-stack
          </a>{" "}
          for local OAuth setup.
        </p>
      </div>
    </section>
  );
}

export function McpHint({ className }: { className?: string }) {
  return (
    <p className={className}>
      Updates happen through MCP.{" "}
      <Link href="/connect" className="text-blue-300 hover:text-blue-200">
        Connect your assistant
      </Link>
      .
    </p>
  );
}
