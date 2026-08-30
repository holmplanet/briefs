import type { Item } from "@briefs/shared/item";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers } from "lucide-react";

import { McpConnectPanel } from "@/components/mcp/connect-panel";
import { ItemStatusBadge } from "@/components/items/item-status-badge";
import { fetchBriefsHealth, fetchItems, isBriefsAuthError } from "@/lib/briefs-api";
import { getSession, loadAuthConfig } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001";

export default async function DailyHomePage() {
  const config = loadAuthConfig();
  const session = await getSession(config);
  const health = await fetchBriefsHealth();
  const apiOnline = health?.status === "ok";
  let items: Item[] = [];

  if (apiOnline && session) {
    try {
      items = await fetchItems();
    } catch (error) {
      if (isBriefsAuthError(error)) {
        redirect(`/login?next=${encodeURIComponent("/")}&error=${encodeURIComponent("Your session expired. Please sign in again.")}`);
      }
      items = [];
    }
  }

  const openItems = items.filter(
    (item) => item.lifecycle === "active" && item.status !== "done" && item.status !== "cancelled",
  );
  const nextItems = openItems.slice(0, 5);

  return (
    <div className="flex flex-col gap-10 pb-16 pt-4">
      <section className="space-y-3">
        <p className="text-sm font-medium text-blue-300/80">Today</p>
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

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-300/80">Work queue</p>
            <h2 className="mt-1 text-xl font-medium tracking-[-0.02em]">Next up</h2>
          </div>
          <Link
            href="/items"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {nextItems.length === 0 ? (
          <div className="glass-panel rounded-3xl border-dashed p-6">
            <p className="font-medium">You’re clear for now.</p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Capture your next task through MCP, or start a brief to turn a thought into durable work.
            </p>
            <Link
              href="/connect"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
            >
              Connect MCP
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="glass-panel divide-y divide-border/60 overflow-hidden rounded-3xl">
            {nextItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/items/${item.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-background/30"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium tracking-[-0.01em]">{item.name}</p>
                      <ItemStatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.kind} · Updated {formatDateTime(item.updatedAt)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <McpConnectPanel />

      {!apiOnline && process.env.NODE_ENV !== "production" ? (
        <div className="glass-panel rounded-3xl border-dashed p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Start the API</p>
          <p className="mt-2">
            Run <code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:system</code>{" "}
            from the repo root.
          </p>
        </div>
      ) : null}
      {!apiOnline && process.env.NODE_ENV === "production" ? (
        <div className="glass-panel rounded-3xl border-dashed p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Briefs is temporarily unavailable</p>
          <p className="mt-2">Refresh in a moment to reconnect to your work.</p>
        </div>
      ) : null}
    </div>
  );
}
