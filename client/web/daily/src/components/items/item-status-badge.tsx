import type { ItemStatus } from "@briefs/shared/item";

import { Badge, cn } from "@briefs/web-shared";

import { formatStatusLabel } from "@/lib/format";

const statusStyles: Record<ItemStatus, string> = {
  open: "border-border/70 bg-card/50 text-muted-foreground",
  in_progress: "border-blue-500/30 bg-blue-500/15 text-blue-200",
  done: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-red-500/25 bg-red-500/10 text-red-200",
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border px-2.5 capitalize", statusStyles[status])}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
}
