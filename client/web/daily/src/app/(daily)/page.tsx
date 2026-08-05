import Link from "next/link";
import { BookOpen, History, Layers } from "lucide-react";

import { CreateItemForm } from "@/components/items/create-item-form";
import { fetchBriefsHealth, fetchItems } from "@/lib/briefs-api";

const docsUrl = process.env.NEXT_PUBLIC_BRIEFS_DOCS_URL ?? "http://localhost:3001";

export default async function DailyHomePage() {
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
    <div className="flex flex-col items-center pb-20 pt-4">
      <section className="flex w-full flex-col items-center text-center">
        <p className="mb-3 text-sm font-medium tracking-[-0.01em] text-blue-300/80">
          Briefs Daily
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
          {recentCount > 0 ? `${recentCount} items` : "All items"}
        </Link>
        <Link
          href="/items"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 px-3 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-md transition hover:bg-card/70 hover:text-foreground"
        >
          <History className="size-3.5" />
          Activity log
        </Link>
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 px-3 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-md transition hover:bg-card/70 hover:text-foreground"
        >
          <BookOpen className="size-3.5" />
          SDK docs
        </a>
      </section>

      {!apiOnline ? (
        <div className="glass-panel mt-10 w-full max-w-2xl rounded-2xl border-dashed p-5 text-center text-sm text-muted-foreground sm:rounded-3xl">
          <p className="font-medium text-foreground">Start the API</p>
          <p className="mt-2">
            Run <code className="rounded-full bg-background/60 px-2 py-0.5">npm run dev:system</code>{" "}
            from the repo root. See{" "}
            <a href={docsUrl} className="text-blue-300 hover:text-blue-200">
              SDK docs
            </a>{" "}
            for setup.
          </p>
        </div>
      ) : null}
    </div>
  );
}
