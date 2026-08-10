import {
  AppShell as SharedAppShell,
  defaultHeaderActions,
  HeaderLink,
  HeaderNav,
} from "@briefs/web-shared";

import { UserMenu } from "@/components/auth/user-menu";
import { fetchBriefsHealth } from "@/lib/briefs-api";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/items", label: "Items" },
  { href: "/chat", label: "Eve" },
  { href: "/connect", label: "Connect" },
] as const;

const docsUrl = process.env.NEXT_PUBLIC_BRIEFS_DOCS_URL ?? "http://localhost:3001";

export async function AppShell({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hero";
}) {
  const health = await fetchBriefsHealth();
  const apiOnline = health?.status === "ok";

  return (
    <SharedAppShell
      variant={variant}
      className={className}
      brandLabel="Briefs Daily"
      brandInitial="D"
      nav={<HeaderNav items={[...navItems]} />}
      actions={defaultHeaderActions({
        apiOnline,
        extra: (
          <>
            <UserMenu />
            <HeaderLink href={docsUrl} label="SDK docs" external />
          </>
        ),
      })}
    >
      {children}
    </SharedAppShell>
  );
}
