"use client";

import { ItemStatus } from "@briefs/shared/item";
import { useTransition } from "react";

import { updateItemStatusAction } from "@/lib/item-actions";
import { Button, cn } from "@briefs/web-shared";
import { formatStatusLabel } from "@/lib/format";

const statuses = [
  ItemStatus.OPEN,
  ItemStatus.IN_PROGRESS,
  ItemStatus.DONE,
  ItemStatus.CANCELLED,
] as const;

export function ItemStatusPicker({
  itemId,
  currentStatus,
}: {
  itemId: string;
  currentStatus: (typeof statuses)[number];
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(nextStatus: (typeof statuses)[number]) {
    if (nextStatus === currentStatus) {
      return;
    }

    startTransition(async () => {
      await updateItemStatusAction(itemId, { status: nextStatus });
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={status === currentStatus ? "default" : "outline"}
          disabled={isPending}
          onClick={() => handleStatusChange(status)}
          className={cn(
            "rounded-full capitalize",
            status === currentStatus
              ? "btn-accent border-transparent text-white"
              : "border-border/70 bg-background/40 hover:bg-card/60",
          )}
        >
          {formatStatusLabel(status)}
        </Button>
      ))}
    </div>
  );
}
