import Link from "next/link";

import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import { cn } from "../lib/utils";

export type WebNavItem = {
  href: string;
  label: string;
};

export type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hero";
  brandHref?: string;
  brandLabel?: string;
  brandInitial?: string;
  navItems?: WebNavItem[];
  apiOnline?: boolean;
  githubHref?: string;
};

export function AppShell({
  children,
  className,
  variant = "default",
  brandHref = "/",
  brandLabel = "Briefs",
  brandInitial = "B",
  navItems = [],
  apiOnline = false,
  githubHref = "https://github.com/holmplanet/briefs",
}: AppShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="glass-header fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href={brandHref} className="group flex items-center gap-2.5 text-foreground">
              <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card/80 text-sm font-semibold shadow-sm transition group-hover:border-primary/40 group-hover:bg-accent">
                {brandInitial}
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.02em]">{brandLabel}</span>
            </Link>
            {navItems.length > 0 ? (
              <nav className="hidden items-center gap-1 sm:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "rounded-full text-muted-foreground hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
          <div className="flex items-center gap-2.5">
            <Badge
              variant={apiOnline ? "default" : "secondary"}
              className={cn(
                "rounded-full border px-2.5",
                apiOnline
                  ? "border-blue-500/30 bg-blue-500/15 text-blue-200"
                  : "border-border bg-card/50 text-muted-foreground",
              )}
            >
              {apiOnline ? "API online" : "API offline"}
            </Badge>
            <Link
              href={githubHref}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full border-border bg-card/40 backdrop-blur-sm hover:bg-card/70",
              )}
            >
              GitHub
            </Link>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-8",
          variant === "hero" ? "pt-28" : "pt-24 pb-12",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
