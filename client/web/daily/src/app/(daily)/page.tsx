import type { Item } from "@briefs/shared/item";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers } from "lucide-react";

import { McpConnectPanel } from "@/components/mcp/connect-panel";
import { fetchBriefsHealth, fetchItems } from "@/lib/briefs-api";
import { getSession, loadAuthConfig } from "@/lib/auth";

const docsUrl = process.env.NEXT_PUBLIC_BRIEFS_DOCS_URL ?? "http://localhost:3001";

export default async function DailyHomePage() {
  const config = loadAuthConfig();
  const session = await getSession(config);
  const health = await fetchBriefsHealth();
  const apiOnline = health?.status === "ok";
  let items: Item[] = [];

  if (apiOnline && session) {
    try {
      items = await fetchItems();
    } catch {
      items = [];
    }
  }

  const openItems = items.filter(
    (item) => item.lifecycle === "active" && item.status !== "done" && item.status !== "cancelled",
  );

  return (
    <div className="flex flex-col gap-10 pb-16 pt-4">
      <section className="space-y-3">
        <p className="text-sm font-medium text-blue-300/80">Briefs Daily</p>
        <h1 className="text-glow text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          {session?.email ? `Welcome back` : "Your tasks"}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          A read-focused view of your durable work. Capture and update items from your assistant via
          MCP — this app shows what changed and who acted on it.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Open items</p>
          <p className="mt-2 text-3xl font-medium">{openItems.length}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total items</p>
          <p className="mt-2 text-3xl font-medium">{items.length}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">API</p>
          <p className="mt-2 text-lg font-medium">{apiOnline ? "Online" : "Offline"}</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link
          href="/briefs/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/30 bg-blue-400/20 px-3 py-1.5 text-sm font-medium text-blue-200 transition hover:bg-blue-400/30"
        >
          Start a brief
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href="/items"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
        >
          <Layers className="size-3.5" />
          View all items
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href="/connect"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
        >
          Connect MCP
        </Link>
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
        >
          <BookOpen className="size-3.5" />
          SDK docs
        </a>
      </section>

      <McpConnectPanel />

      {!apiOnline ? (
        <div className="glass-panel rounded-3xl border-dashed p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Start the API</p>
          <p className="mt-2">
            Run <code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:system</code>{" "}
            from the repo root.
          </p>
        </div>
      ) : null}
    </div>
  );
}
