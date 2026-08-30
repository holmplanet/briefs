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
  { href: "/connect", label: "Connect" },
] as const;

const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001";

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
      brandLabel="Briefs"
      brandLogoSrc="/briefs-logo-white.svg"
      brandLogoAlt="Briefs"
      brandLabelClassName="font-extrabold tracking-[-0.06em]"
      nav={<HeaderNav items={[...navItems]} />}
      actions={defaultHeaderActions({
        apiOnline,
        statusClassName: "hidden sm:inline-flex",
        githubClassName: "hidden sm:inline-flex",
        extra: (
          <>
            <UserMenu />
            <HeaderLink href={docsUrl} label="SDK docs" external className="hidden sm:inline-flex" />
          </>
        ),
      })}
    >
      {children}
    </SharedAppShell>
  );
}
