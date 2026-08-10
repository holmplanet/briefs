import type { Brief, BriefCreateInput } from "@briefs/shared/brief";
import type { Item, ItemCreateInput } from "@briefs/shared/item";
import type { ToolContext } from "eve/tools";

function systemUrl(): string {
  return (process.env.BRIEFS_SYSTEM_URL ?? "http://localhost:8001").replace(/\/$/, "");
}

type EveAuth = Pick<ToolContext, "session">;

function requestHeaders(auth?: EveAuth): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  const principal = auth?.session.auth.current;
  const userId = principal?.principalId ?? process.env.BRIEFS_EVE_USER_ID ?? "demo";
  headers.set("X-Briefs-User-Id", userId);
  const token = principal?.attributes.briefsAccessToken?.toString() ?? process.env.BRIEFS_EVE_ACCESS_TOKEN;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function request<T>(path: string, init: RequestInit = {}, auth?: EveAuth): Promise<T> {
  const response = await fetch(`${systemUrl()}${path}`, {
    ...init,
    headers: new Headers({ ...Object.fromEntries(requestHeaders(auth)), ...Object.fromEntries(new Headers(init.headers)) }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Briefs System request failed: ${response.status}`);
  return JSON.parse(body) as T;
}

export async function listItems(status?: string, auth?: EveAuth): Promise<Item[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return (await request<{ items: Item[] }>(`/api/v1/items${query}`, {}, auth)).items;
}

export async function createItem(input: ItemCreateInput, auth?: EveAuth): Promise<Item> {
  return (await request<{ item: Item }>("/api/v1/items", { method: "POST", body: JSON.stringify(input) }, auth)).item;
}

export async function createBrief(input: BriefCreateInput, auth?: EveAuth): Promise<Brief> {
  return (await request<{ brief: Brief }>("/api/v1/briefs", { method: "POST", body: JSON.stringify(input) }, auth)).brief;
}
