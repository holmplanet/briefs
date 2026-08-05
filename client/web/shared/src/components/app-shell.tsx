import { defaultHeaderActions } from "./header-actions";
import { HeaderNav, type WebNavItem } from "./header-nav";
import { SiteHeader } from "./site-header";
import { cn } from "../lib/utils";

export type { WebNavItem } from "./header-nav";

export type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hero";
  brandHref?: string;
  brandLabel?: string;
  brandInitial?: string;
  /** Custom header navigation. Overrides navItems when set. */
  nav?: React.ReactNode;
  /** Custom header actions. Overrides apiOnline/githubHref defaults when set. */
  actions?: React.ReactNode;
  /** Convenience nav when nav slot is not provided. */
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
  nav,
  actions,
  navItems = [],
  apiOnline = false,
  githubHref = "https://github.com/holmplanet/briefs",
}: AppShellProps) {
  const headerNav = nav ?? (navItems.length > 0 ? <HeaderNav items={navItems} /> : undefined);
  const headerActions =
    actions ??
    defaultHeaderActions({
      apiOnline,
      githubHref,
    });

  return (
    <div className="relative flex min-h-dvh flex-col">
      <SiteHeader
        brandHref={brandHref}
        brandLabel={brandLabel}
        brandInitial={brandInitial}
        nav={headerNav}
        actions={headerActions}
      />

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
