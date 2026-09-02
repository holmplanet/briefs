import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type Health = { status: string; service: string };
type Items = { items: Array<{ id: string; name: string; status: string }> };
type Item = { id: string; name: string; kind: string; status: string; lifecycle: string; description?: string; updatedAt: string };
type Activities = { activities: Array<{ id: string; type: string; summary?: string; occurredAt: string }> };

function AppNav() {
  return <nav className="nav"><a href="/">Flight spike</a><a href="/items">Items</a><a href="/items/new">New brief</a><a href="/api/flight/auth/logout">Log out</a></nav>;
}

function AuthPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const query = window.location.search.slice(1);
  const params = new URLSearchParams(query);
  const isProviderLogin = params.has("client_id") && params.has("redirect_uri");

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/flight/auth/send-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setError(result.error ?? "Unable to send sign-in code"); return; }
    setSent(true);
  }

  async function submitOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/flight/auth/verify-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, otp, oauthQuery: isProviderLogin ? query : "" }) });
    const result = await response.json() as { continuation?: string; error?: string };
    if (!response.ok || !result.continuation) { setError(result.error ?? "Invalid sign-in code"); return; }
    window.location.assign(result.continuation);
  }

  async function startOAuth() {
    const response = await fetch("/api/flight/auth/start");
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) { setError(result.error ?? "OAuth is not configured"); return; }
    window.location.assign(result.url);
  }

  return <Page title="Sign in" description={isProviderLogin ? "Approve your client’s request after signing in." : "Use your Briefs identity to continue."}><form className="panel form" onSubmit={sent ? submitOtp : submitEmail}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={sent} /></label>{sent ? <label>Verification code<input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} required /></label> : null}{error ? <p className="error">{error}</p> : null}<button>{sent ? "Verify and continue" : "Send sign-in code"}</button></form>{!isProviderLogin && !sent ? <button className="secondary-button" type="button" onClick={() => void startOAuth()}>Continue with OAuth</button> : null}</Page>;
}

function ConsentPage() {
  const [error, setError] = useState("");
  const query = window.location.search.slice(1);
  async function approve() {
    const response = await fetch("/api/flight/auth/consent", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ oauthQuery: query }) });
    const result = await response.json() as { continuation?: string; error?: string };
    if (!response.ok || !result.continuation) { setError(result.error ?? "Unable to approve access"); return; }
    window.location.assign(result.continuation);
  }
  return <Page title="Allow access" description="Briefs is requesting permission to connect this client to your account."><section className="panel form"><p className="muted-text">The client will be able to act as you within the permissions it requested.</p>{error ? <p className="error">{error}</p> : null}<button onClick={() => void approve()}>Allow and continue</button><a href="/">Cancel</a></section></Page>;
}

function ItemsPage() {
  const [items, setItems] = useState<Items | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/flight/items")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Items>;
      })
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  return <Page title="Items" description="A React/Vite read surface backed by Flight.">
    {error ? <section className="panel muted"><p className="label">Items unavailable</p><p>Sign in through Daily before loading this surface.</p></section> : null}
    {items ? <section className="panel muted"><p className="label">Authenticated items</p><p>{items.items.length} items loaded through the Flight BFF.</p>{items.items.length > 0 ? <ul className="items-list">{items.items.map((item) => <li key={item.id} className="item-row"><a href={`/items/${item.id}`}>{item.name}</a><span className="status">{item.status.replace("_", " ")}</span></li>)}</ul> : <p className="empty">Create your first brief to see it here.</p>}</section> : null}
  </Page>;
}

function ItemPage({ itemId }: { itemId: string }) {
  const [item, setItem] = useState<Item | null>(null);
  const [activities, setActivities] = useState<Activities | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/flight/items/${encodeURIComponent(itemId)}`).then((response) => response.json() as Promise<{ item?: Item }>),
      fetch(`/api/flight/items/${encodeURIComponent(itemId)}/activities`).then((response) => response.json() as Promise<Activities>),
    ]).then(([itemResponse, activityResponse]) => {
      if (!itemResponse.item) throw new Error();
      setItem(itemResponse.item);
      setActivities(activityResponse);
    }).catch(() => setError(true));
  }, [itemId]);

  return <Page title={item?.name ?? "Item detail"} description={item?.description ?? "Loading item details…"}>
    {error ? <section className="panel muted"><p>Item not found or unavailable.</p></section> : null}
    {item ? <><section className="panel"><div><p className="label">{item.kind} · {item.lifecycle}</p><p className="value">{item.status.replace("_", " ")}</p><p className="muted-text">Updated {new Date(item.updatedAt).toLocaleString()}</p></div></section><section className="panel muted"><p className="label">Activity</p>{activities?.activities.length ? <ul className="activity-list">{activities.activities.map((activity) => <li key={activity.id}><strong>{activity.type}</strong>{activity.summary ? ` — ${activity.summary}` : ""}</li>)}</ul> : <p>No activities recorded yet.</p>}</section></> : null}
  </Page>;
}

function NewItemPage() {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") ?? "").trim();
    const outcome = String(values.get("outcome") ?? "").trim();
    const context = String(values.get("context") ?? "").trim();
    const response = await fetch("/api/flight/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, kind: String(values.get("kind") ?? "task"), description: [`Outcome\n${outcome}`, context ? `Context\n${context}` : ""].filter(Boolean).join("\n\n") }) });
    if (!response.ok) { setError("Could not create this brief."); setSaving(false); return; }
    const result = await response.json() as { item: Item };
    window.location.assign(`/items/${result.item.id}`);
  }

  return <Page title="Start with intent" description="Create a durable item through the Flight BFF."><form className="panel form" onSubmit={submit}><label>Title<input name="name" required /></label><label>Kind<select name="kind" defaultValue="task"><option value="task">Task</option><option value="note">Note</option><option value="commitment">Commitment</option></select></label><label>Outcome<textarea name="outcome" required rows={4} /></label><label>Context<textarea name="context" rows={3} /></label>{error ? <p className="error">{error}</p> : null}<button disabled={saving}>{saving ? "Creating…" : "Create brief"}</button></form></Page>;
}

function Page({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <><AppNav /><main className="shell"><p className="eyebrow">Briefs / Flight spike</p><h1>{title}</h1><p className="lede">{description}</p>{children}</main></>;
}

export function App() {
  const path = window.location.pathname;
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/flight/health")
      .then((response) => response.ok ? response.json() as Promise<Health> : null)
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (path === "/login") return <AuthPage />;
  if (path === "/consent") return <ConsentPage />;
  if (path === "/items") return <ItemsPage />;
  if (path === "/items/new") return <NewItemPage />;
  if (path.startsWith("/items/")) return <ItemPage itemId={path.slice("/items/".length)} />;

  return (
    <Page title="Items, with a smaller runtime seam." description="This isolated React/Vite surface is the migration boundary to evaluate before moving Daily’s full item experience.">
      <section className="panel">
        <div>
          <p className="label">Runtime health</p>
          <p className="value">{health ? `${health.service} · ${health.status}` : "Connecting…"}</p>
        </div>
        <span className={health ? "pill online" : "pill"}>{health ? "online" : "pending"}</span>
      </section>
      <section className="panel muted">
        <p className="label">Next seam</p>
        <p>Keep Better Auth and token-bearing API calls server-side, then add an authenticated `/items` BFF route here.</p>
      </section>
    </Page>
  );
}
