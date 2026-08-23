"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@briefs/web-shared";
import { dailyUrl } from "@/lib/site-config";

type DocLink = {
  href: string;
  label: string;
  external?: boolean;
};

type DocSectionGroup = {
  title: string;
  links: DocLink[];
};

const sections: DocSectionGroup[] = [
  {
    title: "Guide",
    links: [
      { href: "/", label: "Introduction" },
      { href: "/quickstart", label: "Quickstart" },
      { href: "/api", label: "API reference" },
      { href: "/schemas", label: "Schemas" },
      { href: "/build", label: "Build a client" },
    ],
  },
  {
    title: "Apps",
    links: dailyUrl ? [{ href: dailyUrl, label: "Briefs Daily", external: true }] : [],
  },
];

function NavLink({ href, label, external }: DocLink) {
  const pathname = usePathname();
  const active = !external && (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const className = cn(
    "block rounded-lg px-3 py-1.5 text-sm transition-colors",
    active
      ? "bg-accent/80 font-medium text-foreground"
      : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function DocsNav({ className }: { className?: string }) {
  return (
    <nav className={cn("space-y-6", className)} aria-label="Documentation">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.links.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DocsNavMobile() {
  const pathname = usePathname();
  const links = sections.flatMap((section) => section.links);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {links.map((link) => {
        const active =
          !link.external &&
          (link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`));
        const className = cn(
          "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          active
            ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
            : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground",
        );

        if (link.external) {
          return (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={className}>
              {link.label}
            </a>
          );
        }

        return (
          <Link key={link.href} href={link.href} className={className}>
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
