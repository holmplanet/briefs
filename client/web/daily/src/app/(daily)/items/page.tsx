import { ItemStatus, type Item, type ItemStatus as ItemStatusValue } from "@briefs/shared/item";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { McpHint } from "@/components/mcp/connect-panel";
import { ItemLifecycleBadge, ItemStatusBadge } from "@/components/items/item-status-badge";
import { buttonVariants, cn } from "@briefs/web-shared";

import { fetchItems } from "@/lib/briefs-api";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusFilters: Array<{ value?: ItemStatusValue; label: string }> = [
  { label: "All" },
  { value: ItemStatus.OPEN, label: "Open" },
  { value: ItemStatus.IN_PROGRESS, label: "In progress" },
  { value: ItemStatus.DONE, label: "Done" },
  { value: ItemStatus.CANCELLED, label: "Cancelled" },
];

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = statusFilters.some((filter) => filter.value === requestedStatus)
    ? requestedStatus as ItemStatusValue
    : undefined;
  let items: Item[] = [];
  let loadError: string | null = null;

  try {
    items = await fetchItems(status);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load items.";
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-blue-300/80">Briefs Daily</p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Items</h1>
        <p className="max-w-2xl text-muted-foreground">
          Your durable work — tasks, notes, commitments — with stable identity and an append-only
          activity log.
        </p>
        <McpHint className="text-sm text-muted-foreground" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium tracking-[-0.01em]">All items</h2>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/briefs/new"
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/80"
            >
              Create a brief
            </Link>
            <span className="rounded-full border border-border/70 bg-card/40 px-2.5 py-0.5 text-xs text-muted-foreground">
              {items.length} total
            </span>
          </div>
        </div>

        <nav aria-label="Filter items" className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const active = filter.value === status || (!filter.value && !status);
            return (
              <Link
                key={filter.label}
                href={filter.value ? `/items?status=${filter.value}` : "/items"}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-blue-300/40 bg-blue-400/15 text-blue-100" : "border-border/70 bg-card/40 text-muted-foreground hover:bg-card/80 hover:text-foreground"}`}
                aria-current={active ? "page" : undefined}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        {loadError ? (
          <div className="glass-panel rounded-2xl border-dashed p-6 text-sm text-muted-foreground sm:rounded-3xl">
            <p className="font-medium text-foreground">Could not reach the API</p>
            <p className="mt-1">{loadError}</p>
            <p className="mt-3">
              Start the API with{" "}
              <code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:system</code>{" "}
              and sign in with the same user id your MCP client uses.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="glass-panel rounded-2xl border-dashed p-6 text-sm text-muted-foreground sm:rounded-3xl">
            {status ? `No ${status.replace("_", " ")} items yet. ` : "No items yet. "}Create your first task through MCP — see{" "}
            <Link href="/connect" className="text-blue-300 hover:text-blue-200">
              Connect
            </Link>
            .
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
                      <ItemLifecycleBadge lifecycle={item.lifecycle} />
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
