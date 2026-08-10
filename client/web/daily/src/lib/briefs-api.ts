import type { Activity } from "@briefs/shared/activity";
import type { Actor } from "@briefs/shared/actor";
import type { Item } from "@briefs/shared/item";
import type { ItemCreateInput } from "@briefs/shared/item";

import { getSession, loadAuthConfig } from "@/lib/auth";

const apiBase = process.env.NEXT_PUBLIC_BRIEFS_API_URL ?? "http://localhost:8001";

export function getBriefsApiBase(): string {
  return apiBase.replace(/\/$/, "");
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
  const userId = await getBriefsUserId();
  const response = await fetch(`${getBriefsApiBase()}${path}`, {
    ...options,
    headers: {
      "X-Briefs-User-Id": userId,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchBriefsHealth(): Promise<{ status: string; service: string } | null> {
  try {
    const response = await fetch(`${getBriefsApiBase()}/health`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) {
      return null;
    }
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
