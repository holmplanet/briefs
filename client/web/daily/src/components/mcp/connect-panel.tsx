import Link from "next/link";
import { Plug, Terminal } from "lucide-react";

const mcpUrl = process.env.NEXT_PUBLIC_BRIEFS_MCP_URL ?? "http://localhost:3334/mcp";

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
              assistant via <code className="text-foreground">@briefs/mcp</code> — then view changes
              here.
            </p>
          </div>
        </div>

        <ol className="space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1. Start the MCP server</span> —{" "}
            <code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:mcp</code> from
            the repo root.
          </li>
          <li>
            <span className="font-medium text-foreground">2. Connect in Cursor</span> — add the MCP
            server URL below.
          </li>
          <li>
            <span className="font-medium text-foreground">3. Ask your assistant</span> — e.g.
            &quot;create a task to ship the auth flow&quot; or &quot;mark my open items done.&quot;
          </li>
          <li>
            <span className="font-medium text-foreground">4. Refresh Daily</span> — changes appear
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
          . Run <code className="text-foreground">npm run dev:mcp</code> from the briefs repo root.
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
