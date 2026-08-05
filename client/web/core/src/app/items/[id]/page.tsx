import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ActivityTimeline } from "@/components/items/activity-timeline";
import { ItemStatusBadge } from "@/components/items/item-status-badge";
import { ItemStatusPicker } from "@/components/items/item-status-picker";
import { buttonVariants, cn } from "@briefs/web-shared";

import { fetchItem, fetchItemActivities } from "@/lib/briefs-api";
import { formatDateTime } from "@/lib/format";

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
      <div>
        <Link
          href="/items"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-4 rounded-full text-muted-foreground hover:bg-card/50 hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" />
          Back to items
        </Link>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{item.name}</h1>
            <ItemStatusBadge status={item.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {item.kind} · {item.context}
          </p>
          {item.description ? (
            <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>

      <section className="glass-panel space-y-3 rounded-2xl p-5 sm:rounded-3xl">
        <h2 className="text-sm font-medium tracking-[-0.01em] text-muted-foreground">Status</h2>
        <ItemStatusPicker itemId={item.id} currentStatus={item.status} />
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:rounded-3xl">
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
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium tracking-[-0.01em]">Activity log</h2>
          <p className="text-sm text-muted-foreground">Append-only history for this item.</p>
        </div>
        <ActivityTimeline activities={activities} />
      </section>
    </div>
  );
}
