import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { loadAuthConfig } from "@/lib/auth";
import { getInProcessOAuthFetch } from "@/lib/auth/in-process-oauth";

export const dynamic = "force-dynamic";

type ConsentParams = Record<string, string | string[] | undefined>;

function queryString(params: ConsentParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(key, item);
    }
  }
  return query.toString();
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<ConsentParams>;
}) {
  const params = await searchParams;
  const config = loadAuthConfig();
  const oauthQuery = queryString(params);
  const clientId = typeof params.client_id === "string" ? params.client_id : "this client";
  const scopes = typeof params.scope === "string" ? params.scope.split(" ") : [];

  async function acceptConsent() {
    "use server";

    const authConfig = loadAuthConfig();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
    const response = await (await getInProcessOAuthFetch())(
      `${authConfig.issuer}/oauth2/consent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: cookieHeader,
        },
        body: JSON.stringify({ accept: true, oauth_query: oauthQuery }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      redirect(`/login?error=${encodeURIComponent(detail || "Unable to approve access")}`);
    }

    const result = await response.json() as { redirect?: boolean; url?: string; redirect_uri?: string };
    const continuation = result.url ?? result.redirect_uri;
    if (!continuation) redirect("/login?error=missing_consent_redirect");
    redirect(new URL(continuation, authConfig.appUrl).toString());
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <div className="glass-panel space-y-6 rounded-3xl p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-300/80">Briefs</p>
          <h1 className="text-2xl font-medium tracking-[-0.03em]">Allow access?</h1>
          <p className="text-sm text-muted-foreground">
            {clientId} is requesting access to your Briefs identity and the following scopes:
          </p>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {scopes.map((scope) => <li key={scope}>{scope}</li>)}
        </ul>
        <form action={acceptConsent}>
          <button type="submit" className="w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20">
            Allow and continue
          </button>
        </form>
      </div>
    </main>
  );
}
