import { useEffect, useState } from "react";

type Health = { status: string; service: string };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/flight/health")
      .then((response) => response.ok ? response.json() as Promise<Health> : null)
      .then(setHealth)
      .catch(() => setHealth(null));
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
    </main>
  );
}
