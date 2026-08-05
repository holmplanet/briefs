"use client";

import { Plus, Search } from "lucide-react";
import { useState, useTransition } from "react";

import { createItemAction } from "@/app/items/actions";
import { Button, Input, cn } from "@briefs/web-shared";

type CreateItemFormProps = {
  variant?: "card" | "hero";
};

export function CreateItemForm({ variant = "card" }: CreateItemFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const kind = String(formData.get("kind") ?? "task").trim() || "task";

    if (!name) {
      setError("Name is required.");
      return;
    }

    startTransition(async () => {
      try {
        await createItemAction({
          name,
          kind,
          ...(description ? { description } : {}),
        });
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Failed to create item.");
      }
    });
  }

  if (variant === "hero") {
    return (
      <div className="w-full max-w-[880px]">
        <form
          onSubmit={handleSubmit}
          className="search-pill rounded-[26px] p-1.5 sm:rounded-full"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-[22px] bg-background/80 px-4 py-3 sm:flex-row sm:items-center sm:rounded-full sm:py-1.5">
              <div className="min-w-0 flex-1">
                <label htmlFor="hero-name" className="mb-1 block text-xs font-medium text-muted-foreground">
                  What&apos;s next?
                </label>
                <Input
                  id="hero-name"
                  name="name"
                  placeholder="Ship items UI, write spec, follow up..."
                  required
                  disabled={isPending}
                  className="h-auto border-0 bg-transparent px-0 text-[15px] font-medium shadow-none focus-visible:ring-0"
                />
              </div>
              {expanded ? (
                <>
                  <div className="hidden h-5 w-px bg-border sm:block" />
                  <div className="min-w-[100px] sm:w-28">
                    <label htmlFor="hero-kind" className="mb-1 block text-xs font-medium text-muted-foreground">
                      Kind
                    </label>
                    <Input
                      id="hero-kind"
                      name="kind"
                      defaultValue="task"
                      disabled={isPending}
                      className="h-auto border-0 bg-transparent px-0 text-[15px] font-medium shadow-none focus-visible:ring-0"
                    />
                  </div>
                </>
              ) : (
                <input type="hidden" name="kind" value="task" />
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                "btn-accent h-11 shrink-0 rounded-full px-5 text-base font-semibold",
                "sm:h-12",
              )}
            >
              <Search className="size-4 sm:hidden" />
              <span className="hidden sm:inline">{isPending ? "Creating..." : "Capture"}</span>
              <span className="sm:hidden">{isPending ? "..." : "Go"}</span>
            </Button>
          </div>

          {expanded ? (
            <div className="px-4 pb-2 pt-1">
              <label htmlFor="hero-description" className="mb-1 block text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                id="hero-description"
                name="description"
                placeholder="Optional details..."
                disabled={isPending}
                rows={2}
                className="w-full resize-none rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
          ) : null}
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 px-3 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-md transition hover:bg-card/70 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            {expanded ? "Less detail" : "Add detail"}
          </button>
        </div>

        {error ? <p className="mt-3 text-center text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-2xl p-5 sm:rounded-3xl">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-[-0.01em]">New item</h2>
        <p className="text-sm text-muted-foreground">Capture a task, note, or commitment.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="name" className="text-xs font-medium text-muted-foreground">
            Name
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Ship items UI"
            required
            disabled={isPending}
            className="rounded-xl border-border/70 bg-background/60"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="kind" className="text-xs font-medium text-muted-foreground">
            Kind
          </label>
          <Input
            id="kind"
            name="kind"
            defaultValue="task"
            disabled={isPending}
            className="rounded-xl border-border/70 bg-background/60"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Optional details..."
            disabled={isPending}
            rows={3}
            className="flex min-h-20 w-full rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={isPending} className="btn-accent rounded-full px-5 font-semibold">
        {isPending ? "Creating..." : "Create item"}
      </Button>
    </form>
  );
}
