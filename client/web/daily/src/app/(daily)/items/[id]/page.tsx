import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ActivityTimeline } from "@/components/items/activity-timeline";
import { ItemLifecycleBadge, ItemStatusBadge } from "@/components/items/item-status-badge";
import { McpHint } from "@/components/mcp/connect-panel";
import { buttonVariants, cn } from "@briefs/web-shared";

import { fetchItem, fetchItemActivities } from "@/lib/briefs-api";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await fetchItem(id);

  if (!item) {
    notFound();
  }

  const activities = await fetchItemActivities(id);

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-5">
        <Link
          href="/items"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-4 rounded-full text-muted-foreground hover:bg-card/50 hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" />
          Items
        </Link>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <span>Item detail</span>
            <span className="text-border">/</span>
            <span>{item.kind}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{item.name}</h1>
            <ItemStatusBadge status={item.status} />
            <ItemLifecycleBadge lifecycle={item.lifecycle} />
          </div>
          <p className="text-sm text-muted-foreground">{item.context} context</p>
          {item.description ? (
            <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          ) : null}
          <McpHint className="text-sm text-muted-foreground" />
        </div>
      </div>

      <section className="glass-panel space-y-4 rounded-2xl p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-medium">Item details</h2>
            <p className="text-sm text-muted-foreground">Stable timestamps for this piece of work.</p>
          </div>
          <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">
            {item.lifecycle === "active" ? "Active record" : "Archived record"}
          </span>
        </div>
        <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
          <p className="mt-1 text-sm">{formatDateTime(item.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Updated</p>
          <p className="mt-1 text-sm">{formatDateTime(item.updatedAt)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Occurred</p>
          <p className="mt-1 text-sm">{formatDateTime(item.occurredAt)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifecycle</p>
          <p className="mt-1 text-sm capitalize">{item.lifecycle}</p>
        </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium tracking-[-0.01em]">Activity log</h2>
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-xs text-muted-foreground">
              {activities.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Append-only history — each MCP write appears here.
          </p>
        </div>
        <ActivityTimeline activities={activities} />
      </section>
    </div>
  );
}
