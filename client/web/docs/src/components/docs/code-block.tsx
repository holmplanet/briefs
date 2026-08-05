import { cn } from "@briefs/web-shared";

export function CodeBlock({
  code,
  title,
  className,
}: {
  code: string;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/70 bg-[#0d0d12]", className)}>
      {title ? (
        <div className="border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-foreground/90">{code.trim()}</code>
      </pre>
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground/90">
      {children}
    </code>
  );
}
