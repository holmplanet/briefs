import Link from "next/link";
import { Plug, Terminal } from "lucide-react";

import { fetchMcpHealth, getBriefsMcpUrl } from "@/lib/briefs-api";

export async function McpConnectPanel({ className }: { className?: string }) {
  const mcpUrl = getBriefsMcpUrl();
  const hostedMcp = !mcpUrl.includes("localhost") && !mcpUrl.includes("127.0.0.1");
  const health = await fetchMcpHealth();
  const mcpOnline = health?.status === "ok" && health.service === "briefs-mcp";
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
              Briefs Daily is read-focused. Create tasks, update status, and capture work from your
              assistant via MCP — then view changes here.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/30 px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-foreground">MCP server</p>
            <p className="text-xs text-muted-foreground">{mcpOnline ? "Ready for assistant connections" : "Not reachable from Daily"}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${mcpOnline ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
            {mcpOnline ? "Online" : "Offline"}
          </span>
        </div>

        <ol className="space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1. {hostedMcp ? "Connect your assistant" : "Start the MCP server"}</span>{" "}
            — {hostedMcp ? "add the hosted MCP URL below, then sign in with your allowed email when prompted." : <><code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:mcp</code> from the repo root.</>}
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
            {hostedMcp ? "Hosted MCP config" : "Local MCP config"}
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-border/60 bg-background/50 p-4 text-xs leading-relaxed text-foreground/90">
            {cursorConfig}
          </pre>
        </div>

        <p className="text-xs text-muted-foreground">
          MCP URL:{" "}
          <code className="rounded-full bg-background/60 px-2 py-0.5 text-foreground">{mcpUrl}</code>
          {hostedMcp ? "." : <>. Run <code className="text-foreground">npm run dev:mcp</code> from the briefs repo root.</>}
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
