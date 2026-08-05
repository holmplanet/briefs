import { AppShell } from "@/components/app-shell";

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
