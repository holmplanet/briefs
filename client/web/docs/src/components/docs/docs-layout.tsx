import { DocsNav, DocsNavMobile } from "./docs-nav";

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <DocsNavMobile />
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-28">
          <DocsNav />
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-16 lg:max-w-3xl">{children}</div>
    </div>
  );
}
