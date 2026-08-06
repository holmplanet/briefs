import Link from "next/link";

import { getSession, isOAuthEnabled, loadAuthConfig } from "@/lib/auth";
import { HeaderLink } from "@briefs/web-shared";

export async function UserMenu() {
  const config = loadAuthConfig();
  const session = await getSession(config);

  if (!session) {
    return (
      <HeaderLink href="/login" label="Sign in" />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground sm:inline">
        {session.email ?? session.userId}
      </span>
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="rounded-full border border-border bg-card/40 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm transition hover:bg-card/70 hover:text-foreground"
        >
          Sign out
        </button>
      </form>
      {!isOAuthEnabled(config) && session.devBypass ? (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
          Dev
        </span>
      ) : null}
    </div>
  );
}
