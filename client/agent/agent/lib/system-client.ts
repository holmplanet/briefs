import type { Item, ItemCreateInput } from "@briefs/shared/item";

function systemUrl(): string {
  return (process.env.BRIEFS_SYSTEM_URL ?? "http://localhost:8001").replace(/\/$/, "");
}

function requestHeaders(): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  const userId = process.env.BRIEFS_EVE_USER_ID ?? "demo";
  headers.set("X-Briefs-User-Id", userId);
  const token = process.env.BRIEFS_EVE_ACCESS_TOKEN;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${systemUrl()}${path}`, {
    ...init,
    headers: new Headers({ ...Object.fromEntries(requestHeaders()), ...Object.fromEntries(new Headers(init.headers)) }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Briefs System request failed: ${response.status}`);
  return JSON.parse(body) as T;
}

export async function listItems(status?: string): Promise<Item[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return (await request<{ items: Item[] }>(`/api/v1/items${query}`)).items;
}

export async function createItem(input: ItemCreateInput): Promise<Item> {
  return (await request<{ item: Item }>("/api/v1/items", { method: "POST", body: JSON.stringify(input) })).item;
}
