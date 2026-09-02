import { useEffect, useState } from "react";

type Health = { status: string; service: string };
type Items = { items: Array<{ id: string; name: string; status: string }> };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [items, setItems] = useState<Items | null>(null);
  const [itemsError, setItemsError] = useState(false);

  useEffect(() => {
    fetch("/api/flight/health")
      .then((response) => response.ok ? response.json() as Promise<Health> : null)
      .then(setHealth)
      .catch(() => setHealth(null));
    fetch("/api/flight/items")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Items request failed: ${response.status}`);
        return response.json() as Promise<Items>;
      })
      .then(setItems)
      .catch(() => setItemsError(true));
  }, []);

  return (
    <main className="shell">
      <p className="eyebrow">Briefs / Flight spike</p>
      <h1>Items, with a smaller runtime seam.</h1>
      <p className="lede">
        This isolated React/Vite surface is the migration boundary to evaluate before moving
        Daily’s full item experience.
      </p>
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
      {items ? (
        <section className="panel muted">
          <p className="label">Authenticated items</p>
          <p>{items.items.length} items loaded through the Flight BFF.</p>
          {items.items.length > 0 ? (
            <ul className="items-list">
              {items.items.map((item) => (
                <li key={item.id} className="item-row">
                  <span>{item.name}</span>
                  <span className="status">{item.status.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : itemsError ? (
        <section className="panel muted">
          <p className="label">Items unavailable</p>
          <p>Sign in through Daily before loading this Flight surface.</p>
        </section>
      ) : null}
    </main>
  );
}
