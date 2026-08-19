import {
  AppShell as SharedAppShell,
  defaultHeaderActions,
  HeaderLink,
} from "@briefs/web-shared";

import { fetchBriefsHealth } from "@/lib/briefs-api";

const dailyUrl = process.env.NEXT_PUBLIC_DAILY_URL ?? "http://localhost:3000";

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
      actions={defaultHeaderActions({
        apiOnline,
        extra: <HeaderLink href={dailyUrl} label="Briefs Daily" external />,
      })}
    >
      {children}
    </SharedAppShell>
  );
}
