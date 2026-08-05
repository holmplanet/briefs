import { AppShell as SharedAppShell } from "@briefs/web-shared";

import { fetchBriefsHealth } from "@/lib/briefs-api";

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
      brandLabel="Briefs SDK"
      navItems={[]}
      apiOnline={apiOnline}
    >
      {children}
    </SharedAppShell>
  );
}
