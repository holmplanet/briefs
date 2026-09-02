import { loadAuthConfig } from "@/lib/auth";
import { ConsentButton } from "./consent-button";

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

  const consentEndpoint = `${config.issuer}/oauth2/consent`;

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
        <ConsentButton consentEndpoint={consentEndpoint} oauthQuery={oauthQuery} />
      </div>
    </main>
  );
}
