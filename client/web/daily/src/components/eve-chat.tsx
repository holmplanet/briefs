"use client";

import { FormEvent, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

type EveSessionResponse = { sessionId: string; continuationToken: string };

export function EveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("What's on my plate?");
  const [session, setSession] = useState<EveSessionResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || pending) return;

    setDraft("");
    setError(null);
    setMessages((current) => [...current, { role: "user", text: message }, { role: "assistant", text: "" }]);
    setPending(true);

    try {
      const endpoint = session ? `/api/eve/session/${session.sessionId}` : "/api/eve/session";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session ? { continuationToken: session.continuationToken, message } : { message }),
      });
      if (!response.ok) throw new Error((await response.text()) || "Eve request failed");
      const nextSession = (await response.json()) as EveSessionResponse;
      setSession(nextSession);

      const stream = await fetch(`/api/eve/session/${nextSession.sessionId}/stream`);
      if (!stream.ok || !stream.body) throw new Error("Eve stream failed");
      const reader = stream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const eventData = JSON.parse(line) as {
            type?: string;
            data?: { messageDelta?: string; message?: string };
          };
          if (eventData.type === "turn.failed" || eventData.type === "session.failed") {
            throw new Error(eventData.data?.message || "Eve could not complete the request");
          }
          if (eventData.type === "message.appended" && eventData.data?.messageDelta) {
            setMessages((current) => {
              const next = [...current];
              next[next.length - 1] = { role: "assistant", text: next[next.length - 1].text + eventData.data!.messageDelta };
              return next;
            });
          }
        }
        if (chunk.done) break;
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Eve request failed");
      setMessages((current) => current.slice(0, -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glass-panel rounded-3xl p-5 sm:p-7">
      <div className="min-h-64 space-y-4">
        {messages.length === 0 ? <p className="text-sm text-muted-foreground">Start with a question for Eve.</p> : null}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-blue-500/20 px-4 py-3 text-sm" : "max-w-[90%] rounded-2xl bg-background/50 px-4 py-3 text-sm"}>
            {message.text || (pending && message.role === "assistant" ? "Thinking…" : "")}
          </div>
        ))}
      </div>
      {error ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <form onSubmit={send} className="mt-6 flex gap-2">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Eve…" className="min-w-0 flex-1 rounded-full border border-border bg-background/50 px-4 py-2 text-sm outline-none focus:border-blue-300/60" disabled={pending} />
        <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={pending || !draft.trim()}>Send</button>
      </form>
    </section>
  );
}
