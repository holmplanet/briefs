import type { Item } from "@briefs/shared/item";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CreateItemForm } from "@/components/items/create-item-form";
import { ItemStatusBadge } from "@/components/items/item-status-badge";
import { buttonVariants, cn } from "@briefs/web-shared";

import { fetchItems } from "@/lib/briefs-api";
import { formatDateTime } from "@/lib/format";

export default async function ItemsPage() {
  let items: Item[] = [];
  let loadError: string | null = null;

  try {
    items = await fetchItems();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load items.";
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-blue-300/80">Your work</p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Items</h1>
        <p className="max-w-2xl text-muted-foreground">
          Durable tasks, notes, and commitments — with stable identity and an append-only activity
          log.
        </p>
      </section>

      <CreateItemForm />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium tracking-[-0.01em]">All items</h2>
          <span className="rounded-full border border-border/70 bg-card/40 px-2.5 py-0.5 text-xs text-muted-foreground">
            {items.length} total
          </span>
        </div>

        {loadError ? (
          <div className="glass-panel rounded-2xl border-dashed p-6 text-sm text-muted-foreground sm:rounded-3xl">
            <p className="font-medium text-foreground">Could not reach the API</p>
            <p className="mt-1">{loadError}</p>
            <p className="mt-3">
              Start the API with{" "}
              <code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:system</code> and
              set{" "}
              <code className="rounded-full bg-background/60 px-2 py-0.5">
                NEXT_PUBLIC_BRIEFS_API_URL
              </code>{" "}
              in{" "}
              <code className="rounded-full bg-background/60 px-2 py-0.5">
                client/web/core/.env.local
              </code>
              .
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="glass-panel rounded-2xl border-dashed p-6 text-sm text-muted-foreground sm:rounded-3xl">
            No items yet. Capture one above to get started.
          </div>
        ) : (
          <ul className="glass-panel divide-y divide-border/60 overflow-hidden rounded-2xl sm:rounded-3xl">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/items/${item.id}`}
                  className="flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-background/30 sm:px-5"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium tracking-[-0.01em]">{item.name}</p>
                      <ItemStatusBadge status={item.status} />
                      <span className="rounded-full bg-background/50 px-2 py-0.5 text-xs text-muted-foreground">
                        {item.kind}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDateTime(item.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "shrink-0 rounded-full text-muted-foreground hover:bg-background/50",
                    )}
                  >
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
