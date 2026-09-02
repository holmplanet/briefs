"use client";

import { useState } from "react";

type ConsentButtonProps = {
  consentEndpoint: string;
  oauthQuery: string;
};

export function ConsentButton({ consentEndpoint, oauthQuery }: ConsentButtonProps) {
  const [loading, setLoading] = useState(false);

  async function acceptConsent() {
    setLoading(true);
    try {
      const response = await fetch(consentEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accept: true, oauth_query: oauthQuery }),
      });
      const result = await response.json() as { url?: string; redirect_uri?: string; error?: string };
      const continuation = result.url ?? result.redirect_uri;
      if (!response.ok || !continuation) {
        throw new Error(result.error ?? "Unable to approve access");
      }
      window.location.assign(continuation);
    } catch (error) {
      window.location.assign(`/login?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to approve access")}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void acceptConsent()}
      className="w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 disabled:opacity-60"
    >
      {loading ? "Approving…" : "Allow and continue"}
    </button>
  );
}
