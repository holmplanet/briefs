import {
  AppShell as SharedAppShell,
  GitHubLink,
  HeaderLink,
} from "@briefs/web-shared";

import { dailyUrl } from "@/lib/urls";

export async function AppShell({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hero";
}) {
  return (
    <SharedAppShell
      variant={variant}
      className={className}
      brandLabel="Briefs SDK"
      brandLabelClassName="font-extrabold lowercase tracking-[-0.08em]"
      brandLogoSrc="/briefs-logo-white.svg"
      brandLogoAlt="Briefs"
      actions={
        <>
          <HeaderLink href={dailyUrl()} label="Briefs Daily" external />
          <GitHubLink />
        </>
      }
    >
      {children}
    </SharedAppShell>
  );
}
