import { ArrowRight, Layers, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchBriefsHealth } from "@/lib/briefs-api";

export default async function HomePage() {
  const health = await fetchBriefsHealth();
  const apiOnline = health?.status === "ok";

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">Briefs</span>
            <Badge variant={apiOnline ? "default" : "secondary"}>
              {apiOnline ? "API online" : "API offline"}
            </Badge>
          </div>
          <Link
            href="https://github.com/holmplanet/briefs"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            GitHub
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
        <section className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Holmplanet Briefs
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Capture stitches. Synthesize briefs.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            The core web app for base users — manage open stitches, generate point-in-time briefs,
            and stay oriented without drowning in tabs.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg border bg-muted">
                <Layers className="size-5" />
              </div>
              <CardTitle>Stitches</CardTitle>
              <CardDescription>
                Atomic items you capture — tasks, notes, commitments — woven into your graph.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                CRUD via <code className="rounded bg-muted px-1 py-0.5">/api/v1/stitches</code>.
                Open and in-progress stitches feed the brief generator.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full sm:w-auto" disabled>
                Stitches UI
                <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg border bg-muted">
                <Sparkles className="size-5" />
              </div>
              <CardTitle>Brief me</CardTitle>
              <CardDescription>
                AI-generated snapshots from your stitches and brief history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Trigger via{" "}
                <code className="rounded bg-muted px-1 py-0.5">POST /api/v1/brief/generate</code>.
                v0 synthesizer ranks open stitches; LLM wiring comes next.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full sm:w-auto" variant="secondary" disabled>
                Generate brief
                <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </Card>
        </section>

        {!apiOnline ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Start the API</CardTitle>
              <CardDescription>
                From the repo root: <code className="rounded bg-muted px-1">npm run dev:system</code>{" "}
                or <code className="rounded bg-muted px-1">npm run docker:up</code>
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
