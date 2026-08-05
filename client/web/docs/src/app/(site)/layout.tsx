import { AppShell } from "@/components/app-shell";
import { DocsLayout } from "@/components/docs/docs-layout";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <DocsLayout>{children}</DocsLayout>
    </AppShell>
  );
}
