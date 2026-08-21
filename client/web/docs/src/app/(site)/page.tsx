import Link from "next/link";
import { ArrowRight, Box, GitBranch, Layers, Terminal, Users } from "lucide-react";

import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection, DocTable } from "@/components/docs/doc-section";
import { fetchBriefsHealth } from "@/lib/briefs-api";
import { curlHealth } from "@/lib/docs-snippets";
import { dailyUrl } from "@/lib/urls";

export default async function DocsHomePage() {
  const health = await fetchBriefsHealth();
  const apiOnline = health?.status === "ok";

  return (
    <>
      <DocPageHeader
        eyebrow="Holmplanet Briefs"
        title="Build on a durable work spine"
        description="Briefs is a schema-first platform for items, actors, and activities. Use the REST API, Zod schemas in @briefs/shared, and web primitives in @briefs/web-shared to ship web clients and integrations."
      />

      <div className="mb-10 flex flex-wrap gap-2">
        <Link
          href="/quickstart"
          className="btn-accent inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
        >
          Get started
          <ArrowRight className="size-4" />
        </Link>
        <a
          href={dailyUrl()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-card/70 hover:text-foreground"
        >
          Briefs Daily source
        </a>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Layers,
            title: "Items",
            body: "Durable entities — tasks, notes, ingest — with stable identity and workflow fields.",
          },
          {
            icon: Users,
            title: "Actors",
            body: "People and services that act. Every write records who performed it.",
          },
          {
            icon: GitBranch,
            title: "Activities",
            body: "Append-only log per item — creates, updates, and structured change deltas.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="glass-panel rounded-2xl p-4 sm:rounded-3xl">
            <Icon className="mb-3 size-4 text-blue-300" />
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="space-y-12">
        <DocSection id="architecture" title="Monorepo layout">
          <p>
            Briefs follows a schema-first split: contracts in <code className="text-foreground">@briefs/shared</code>,
            the write path in <code className="text-foreground">@briefs/system</code>, and web clients in{" "}
            <code className="text-foreground">client/web/*</code>.
          </p>
          <CodeBlock
            title="Repository"
            code={`shared/              @briefs/shared — Zod schemas
system/              @briefs/system — REST API + Postgres
client/web/
  shared/            @briefs/web-shared — UI + theme
  docs/              @briefs/docs — SDK documentation
  daily/             @briefs/daily — reference web client
client/plugin/       Cursor/Codex skills`}
          />
        </DocSection>

        <DocSection id="packages" title="Packages">
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Package</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["@briefs/shared", "Item, Actor, Activity Zod schemas and types"],
                ["@briefs/system", "Express API, stores, domain services"],
                ["@briefs/web-shared", "Shared Next.js UI primitives and theme"],
                ["@briefs/docs", "SDK documentation site"],
                ["@briefs/daily", "Default daily-driver web client"],
              ].map(([pkg, role]) => (
                <tr key={pkg}>
                  <td className="px-4 py-2.5 font-mono text-xs">{pkg}</td>
                  <td className="px-4 py-2.5">{role}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </DocSection>

        <DocSection id="write-path" title="Write path">
          <p>
            Item projection updates and activity records happen together. On create, activities carry a compact{" "}
            <code className="text-foreground">result.created</code> payload. On update,{" "}
            <code className="text-foreground">result.changes</code> holds field-level before/after deltas.
          </p>
          <p>
            Clients should treat the API as the system of record — validate inputs with shared schemas, send writes
            through the REST surface, and read activity logs for audit and UI history.
          </p>
        </DocSection>

        <DocSection id="status" title="Local API">
          <div className="flex items-center gap-2 text-foreground">
            <Box className="size-4 text-muted-foreground" />
            <span className={apiOnline ? "text-emerald-300" : "text-amber-300"}>
              {apiOnline ? `API online — ${health?.service}` : "API offline"}
            </span>
          </div>
          {!apiOnline ? (
            <p>
              Run <code className="text-foreground">npm run dev:system</code> from the repo root. See{" "}
              <Link href="/quickstart" className="text-blue-300 hover:text-blue-200">
                Quickstart
              </Link>{" "}
              for port and env setup.
            </p>
          ) : (
            <CodeBlock title="Health check" code={curlHealth()} />
          )}
        </DocSection>

        <DocSection id="next" title="Next steps">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <Link href="/quickstart" className="text-blue-300 hover:text-blue-200">
                Quickstart
              </Link>{" "}
              — install, run locally, first requests
            </li>
            <li>
              <Link href="/api" className="text-blue-300 hover:text-blue-200">
                API reference
              </Link>{" "}
              — endpoints, auth, curl examples
            </li>
            <li>
              <Link href="/schemas" className="text-blue-300 hover:text-blue-200">
                Schemas
              </Link>{" "}
              — imports from @briefs/shared
            </li>
            <li>
              <Link href="/build" className="text-blue-300 hover:text-blue-200">
                Build a client
              </Link>{" "}
              — web client on @briefs/web-shared
            </li>
            <li>
              <a
                href={dailyUrl()}
                className="text-blue-300 hover:text-blue-200"
                target="_blank"
                rel="noreferrer"
              >
                Briefs Daily source
              </a>{" "}
              — reference web client and local setup
            </li>
          </ul>
          <p className="flex items-center gap-2 pt-2">
            <Terminal className="size-4 shrink-0" />
            Assistant integration lives in <code className="text-foreground">client/plugin/</code> — skills and MCP
            manifests for Cursor and Codex.
          </p>
        </DocSection>
      </div>
    </>
  );
}
