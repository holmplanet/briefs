import Link from "next/link";

import { buttonVariants } from "./ui/button";
import { cn } from "../lib/utils";

export type WebNavItem = {
  href: string;
  label: string;
};

export function HeaderNav({
  items,
  className,
}: {
  items: WebNavItem[];
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={cn("hidden items-center gap-1 sm:flex", className)}>
      {items.map((item) => (
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
  );
}
