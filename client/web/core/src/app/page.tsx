import Link from "next/link";
import { ArrowRight, History, Layers } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CreateItemForm } from "@/components/items/create-item-form";
import { fetchBriefsHealth, fetchItems } from "@/lib/briefs-api";

export default async function HomePage() {
  const health = await fetchBriefsHealth();
  const apiOnline = health?.status === "ok";
  let recentCount = 0;

  if (apiOnline) {
    try {
      const items = await fetchItems();
      recentCount = items.length;
    } catch {
      recentCount = 0;
    }
  }

  return (
    <AppShell variant="hero" className="items-center pb-20">
      <section className="flex w-full flex-col items-center text-center">
        <p className="mb-3 text-sm font-medium tracking-[-0.01em] text-blue-300/80">
          Holmplanet Briefs
        </p>
        <h1 className="text-glow max-w-3xl text-[clamp(2rem,6vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground">
          What&apos;s next?
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Capture durable work — items you track, who acted on them, and an append-only log of
          what changed.
        </p>
      </section>

      <section className="mt-10 flex w-full justify-center px-1 sm:mt-12">
        <CreateItemForm variant="hero" />
      </section>

      <section className="mt-10 flex w-full flex-wrap items-center justify-center gap-2">
        <Link
          href="/items"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 px-3 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-md transition hover:bg-card/70 hover:text-foreground"
        >
          <Layers className="size-3.5" />
          {recentCount > 0 ? `${recentCount} items` : "Browse items"}
        </Link>
        <Link
          href="/items"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 px-3 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-md transition hover:bg-card/70 hover:text-foreground"
        >
          <History className="size-3.5" />
          Activity log
        </Link>
      </section>

      <section className="mt-14 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5 sm:rounded-3xl">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/50">
            <Layers className="size-4 text-blue-300" />
          </div>
          <h2 className="font-semibold tracking-[-0.01em]">Items</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Tasks, notes, commitments — stable identity, workflow fields, and context.
          </p>
          <Link
            href="/items"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-300 transition hover:text-blue-200"
          >
            Open items
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="glass-panel rounded-2xl p-5 sm:rounded-3xl">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/50">
            <History className="size-4 text-violet-300" />
          </div>
          <h2 className="font-semibold tracking-[-0.01em]">Activities</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Every change is recorded — create, update, move — with structured deltas.
          </p>
          <Link
            href="/items"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-300 transition hover:text-violet-200"
          >
            View history
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {!apiOnline ? (
        <div className="glass-panel mt-10 w-full max-w-2xl rounded-2xl border-dashed p-5 text-center text-sm text-muted-foreground sm:rounded-3xl">
          <p className="font-medium text-foreground">Start the API</p>
          <p className="mt-2">
            Run <code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:system</code>{" "}
            from the repo root. If port 8000 is taken, use{" "}
            <code className="rounded-full bg-background/60 px-2 py-0.5">BRIEFS_PORT=8001</code> and
            set <code className="rounded-full bg-background/60 px-2 py-0.5">NEXT_PUBLIC_BRIEFS_API_URL</code>{" "}
            in <code className="rounded-full bg-background/60 px-2 py-0.5">.env.local</code>.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
