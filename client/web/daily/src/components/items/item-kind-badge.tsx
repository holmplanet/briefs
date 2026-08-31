import { Badge, cn } from "@briefs/web-shared";

const kindStyles: Record<string, string> = {
  task: "border-slate-400/25 bg-slate-400/10 text-slate-200",
  commitment: "border-violet-400/30 bg-violet-400/12 text-violet-200",
  project: "border-cyan-400/30 bg-cyan-400/12 text-cyan-200",
  event: "border-amber-400/30 bg-amber-400/12 text-amber-200",
  note: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  decision: "border-fuchsia-400/30 bg-fuchsia-400/12 text-fuchsia-200",
  idea: "border-sky-400/30 bg-sky-400/12 text-sky-200",
  question: "border-orange-400/30 bg-orange-400/12 text-orange-200",
};

export function ItemKindBadge({ kind }: { kind: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 capitalize",
        kindStyles[kind.toLowerCase()] ?? "border-border/80 bg-card text-muted-foreground",
      )}
    >
      {kind}
    </Badge>
  );
}
