import { AppShell as SharedAppShell } from "@briefs/web-shared";

import { fetchBriefsHealth } from "@/lib/briefs-api";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/items", label: "Items" },
] as const;

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
      navItems={[...navItems]}
      apiOnline={apiOnline}
    >
      {children}
    </SharedAppShell>
  );
}
