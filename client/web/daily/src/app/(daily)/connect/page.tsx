import { McpConnectPanel } from "@/components/mcp/connect-panel";

export const dynamic = "force-dynamic";

export default function ConnectPage() {
  return (
    <div className="flex flex-col gap-8 pb-16 pt-4">
      <section className="space-y-2">
        <p className="text-sm font-medium text-blue-300/80">Briefs</p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Connect MCP</h1>
        <p className="max-w-2xl text-muted-foreground">
          Your assistant is your inbox — connect once, then create
          and update items through MCP tools.
        </p>
      </section>

      <McpConnectPanel />
    </div>
  );
}
