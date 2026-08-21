import Link from "next/link";

import { cn } from "../lib/utils";

export type SiteHeaderBrandProps = {
  href?: string;
  label?: string;
  initial?: string;
  logoSrc?: string;
  logoAlt?: string;
  className?: string;
};

export function SiteHeaderBrand({
  href = "/",
  label = "Briefs",
  initial = "B",
  logoSrc,
  logoAlt = "",
  className,
}: SiteHeaderBrandProps) {
  return (
    <Link href={href} className={cn("group flex shrink-0 items-center gap-2.5 text-foreground", className)}>
      {logoSrc ? (
        <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card/80 p-1.5 shadow-sm transition group-hover:border-primary/40 group-hover:bg-accent">
          <img src={logoSrc} alt={logoAlt} className="size-full object-contain" />
        </span>
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card/80 text-sm font-semibold shadow-sm transition group-hover:border-primary/40 group-hover:bg-accent">
          {initial}
        </span>
      )}
      <span className="text-[15px] font-semibold tracking-[-0.02em]">{label}</span>
    </Link>
  );
}

export type SiteHeaderProps = {
  brandHref?: string;
  brandLabel?: string;
  brandInitial?: string;
  brandLogoSrc?: string;
  brandLogoAlt?: string;
  /** Site-specific navigation — pass a client nav, link list, or null to omit. */
  nav?: React.ReactNode;
  /** Site-specific header actions — status badges, external links, menus, etc. */
  actions?: React.ReactNode;
  className?: string;
};

export function SiteHeader({
  brandHref = "/",
  brandLabel = "Briefs",
  brandInitial = "B",
  brandLogoSrc,
  brandLogoAlt,
  nav,
  actions,
  className,
}: SiteHeaderProps) {
  return (
    <header className={cn("glass-header fixed inset-x-0 top-0 z-30", className)}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <SiteHeaderBrand
            href={brandHref}
            label={brandLabel}
            initial={brandInitial}
            logoSrc={brandLogoSrc}
            logoAlt={brandLogoAlt}
          />
          {nav ? <div className="min-w-0">{nav}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2.5">{actions}</div> : null}
      </div>
    </header>
  );
}
