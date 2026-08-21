import type { Activity } from "@briefs/shared/activity";
import type { Actor } from "@briefs/shared/actor";
import type { Item } from "@briefs/shared/item";
import type { ItemCreateInput } from "@briefs/shared/item";

import { getSession, loadAuthConfig } from "@/lib/auth";
import { getBriefsHealthUrls as buildBriefsHealthUrls } from "./briefs-api-urls";

export function getBriefsApiBase(): string {
  return (
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001"
  ).replace(/\/$/, "");
}

export function getBriefsMcpUrl(): string {
  return (process.env.NEXT_PUBLIC_MCP_URL ?? "http://localhost:3334/mcp").replace(/\/$/, "");
}

function getBriefsMcpHealthUrl(): string {
  return (process.env.MCP_HEALTH_URL ?? getBriefsMcpUrl()).replace(/\/$/, "");
}

export async function getBriefsUserId(): Promise<string> {
  const config = loadAuthConfig();
  const session = await getSession(config);
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session.userId;
}

type FetchOptions = RequestInit & {
  next?: NextFetchRequestConfig;
};

async function briefsFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const config = loadAuthConfig();
  const session = await getSession(config);
  if (!session) {
    throw new Error("Not authenticated");
  }

  const requestHeaders = new Headers(options.headers);
  requestHeaders.set("Content-Type", "application/json");
  if (session.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  } else {
    requestHeaders.set("X-Briefs-User-Id", session.userId);
  }

  const response = await fetch(`${getBriefsApiBase()}${path}`, {
    ...options,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchBriefsHealth(): Promise<{ status: string; service: string } | null> {
  for (const url of buildBriefsHealthUrls(getBriefsApiBase())) {
    try {
      const response = await fetch(url, { next: { revalidate: 30 } });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        continue;
      }
      return response.json();
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchMcpHealth(): Promise<{
  status: string;
  service: string;
  devSkipAuth?: boolean;
} | null> {
  try {
    const response = await fetch(new URL("/health", getBriefsMcpHealthUrl()).toString(), {
      next: { revalidate: 30 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function fetchItems(status?: string): Promise<Item[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await briefsFetch<{ items: Item[] }>(`/api/v1/items${query}`, {
    next: { tags: ["items"] },
  });
  return data.items;
}

export async function fetchItem(itemId: string): Promise<Item | null> {
  try {
    const data = await briefsFetch<{ item: Item }>(`/api/v1/items/${itemId}`, {
      next: { tags: [`item-${itemId}`] },
    });
    return data.item;
  } catch {
    return null;
  }
}

export async function fetchItemActivities(itemId: string): Promise<Activity[]> {
  const data = await briefsFetch<{ activities: Activity[] }>(
    `/api/v1/items/${itemId}/activities`,
    { next: { tags: [`item-${itemId}-activities`] } },
  );
  return data.activities;
}

export async function fetchActorMe(): Promise<Actor> {
  const data = await briefsFetch<{ actor: Actor }>("/api/v1/actors/me", {
    next: { tags: ["actor-me"] },
  });
  return data.actor;
}

export async function createItem(input: ItemCreateInput): Promise<Item> {
  const data = await briefsFetch<{ item: Item }>("/api/v1/items", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.item;
}
