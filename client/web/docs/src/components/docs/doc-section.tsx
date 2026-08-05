import { cn } from "@briefs/web-shared";

export function DocPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-10 space-y-3 border-b border-border/50 pb-8">
      {eyebrow ? (
        <p className="text-sm font-medium tracking-[-0.01em] text-blue-300/80">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{title}</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {description}
      </p>
    </header>
  );
}

export function DocSection({
  id,
  title,
  children,
  className,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28 space-y-4", className)}>
      <h2 className="text-xl font-medium tracking-[-0.02em]">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_p]:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function DocTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
