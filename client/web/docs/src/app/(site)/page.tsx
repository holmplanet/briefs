import Link from "next/link";
import { ArrowRight, GitBranch, Layers, Terminal, Users } from "lucide-react";

import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection, DocTable } from "@/components/docs/doc-section";
import { dailyUrl } from "@/lib/urls";

export default async function DocsHomePage() {
  return (
    <>
      <DocPageHeader
        eyebrow="Holmplanet Briefs"
        title="Build on a durable work spine"
        description="Briefs is a durable work substrate for applications where assistants, people, and automations need to create, update, and review the same body of work."
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
          Briefs Daily
        </a>
      </div>

      <div className="mb-12 space-y-10">
        <DocSection id="why" title="Why Briefs exists">
          <p>
            Assistants are good at turning conversations into action, but that work should not disappear when the
            conversation ends. Briefs gives developers a durable system of record for work that can be shared across
            assistants, applications, and people.
          </p>
          <p>
            Instead of rebuilding persistence, identity, activity history, schemas, and MCP integration for every
            product, developers can build on one work contract and choose the clients that fit their users.
          </p>
        </DocSection>

        <DocSection id="flow" title="How it works">
          <p>
            A natural-language request becomes a structured item through MCP. The System API stores the item and its
            activity history, and Daily or a custom client gives people a place to review what changed.
          </p>
          <p className="font-mono text-xs text-foreground/90 sm:text-sm">
            conversation → MCP write → item + activity → API → Daily or custom client
          </p>
        </DocSection>

        <DocSection id="use-cases" title="What developers build">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Terminal,
                title: "Assistant workflows",
                body: "Turn requests like “follow up with the design team” into structured, reviewable work instead of ephemeral chat output.",
              },
              {
                icon: GitBranch,
                title: "Agent operations",
                body: "Let services create and update work with actor attribution and an append-only history of every change.",
              },
              {
                icon: Layers,
                title: "Custom clients",
                body: "Build a CRM, research queue, content pipeline, or operations console on the same shared contracts.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-panel rounded-2xl p-4 sm:rounded-3xl">
                <Icon className="mb-3 size-4 text-blue-300" />
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </DocSection>
      </div>

      <DocSection id="core-model" title="Core model" className="mb-12">
        <p>
          Briefs keeps the work object, the responsible actor, and the history of change together. These three
          primitives are the shared contract behind the API, MCP tools, Daily, and custom clients.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
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
      </DocSection>

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

        <DocSection id="next" title="Next steps">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <Link href="/quickstart" className="text-blue-300 hover:text-blue-200">
                Quickstart
              </Link>{" "}
              — install, run locally, first requests
            </li>
            <li>
              <Link href="/walkthrough" className="text-blue-300 hover:text-blue-200">
                Developer walkthrough
              </Link>{" "}
              — request to durable work
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
              <Link href="/protocols" className="text-blue-300 hover:text-blue-200">
                Protocols
              </Link>{" "}
              — MCP, OAuth, and schema boundaries
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
                Briefs Daily
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
