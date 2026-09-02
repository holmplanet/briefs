"use client";

import { useState } from "react";

type OtpFormProps = { email: string; next: string; oauthQuery: string };

export function OtpForm({ email, next, oauthQuery }: OtpFormProps) {
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    try {
      const response = await fetch("/auth/otp", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          otp: String(formData.get("otp") ?? ""),
          next,
          oauthQuery,
        }),
      });
      const result = await response.json() as { continuation?: string; error?: string };
      if (!response.ok || !result.continuation) throw new Error(result.error ?? "Invalid sign-in code");
      window.location.assign(result.continuation);
    } catch (error) {
      window.location.assign(`/login?otp=sent&error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid sign-in code")}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={(formData) => void submit(formData)} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Email code</span>
        <input name="otp" inputMode="numeric" autoComplete="one-time-code" required className="w-full rounded-xl border border-border bg-background/60 px-3 py-2" />
      </label>
      <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 disabled:opacity-60">
        {loading ? "Verifying…" : "Verify and continue"}
      </button>
    </form>
  );
}
