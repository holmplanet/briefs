import Link from "next/link";

import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import { cn } from "../lib/utils";

export function ApiStatusBadge({ online = false, className }: { online?: boolean; className?: string }) {
  return (
    <Badge
      variant={online ? "default" : "secondary"}
      className={cn(
        "rounded-full border px-2.5",
        online
          ? "border-blue-500/30 bg-blue-500/15 text-blue-200"
        : "border-border bg-card/50 text-muted-foreground",
        className,
      )}
    >
      {online ? "API online" : "API offline"}
    </Badge>
  );
}

export function GitHubLink({
  href = "https://github.com/holmplanet/briefs",
  label = "GitHub",
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "rounded-full border-border bg-card/80 hover:bg-card",
        className,
      )}
    >
      {label}
    </Link>
  );
}

export function HeaderLink({
  href,
  label,
  external = false,
  className,
}: {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
}) {
  const linkClassName = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "rounded-full border-border bg-card/80 hover:bg-card",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={linkClassName}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClassName}>
      {label}
    </Link>
  );
}

export function defaultHeaderActions({
  apiOnline = false,
  githubHref,
  statusClassName,
  githubClassName,
  extra,
}: {
  apiOnline?: boolean;
  githubHref?: string;
  statusClassName?: string;
  githubClassName?: string;
  extra?: React.ReactNode;
} = {}) {
  return (
    <>
      <ApiStatusBadge online={apiOnline} className={statusClassName} />
      {extra}
      <GitHubLink href={githubHref} className={githubClassName} />
    </>
  );
}
