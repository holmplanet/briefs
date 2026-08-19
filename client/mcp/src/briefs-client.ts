import type { Activity } from "@briefs/shared/activity";
import type { Actor } from "@briefs/shared/actor";
import type { Brief, BriefCreateInput } from "@briefs/shared/brief";
import type { Item, ItemCreateInput, ItemUpdateInput } from "@briefs/shared/item";

export class BriefsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BriefsApiError";
  }
}

export class BriefsApiClient {
  constructor(
    private readonly apiUrl: string,
    private readonly userId: string,
    private readonly accessToken?: string,
  ) {}

  async listItems(status?: string): Promise<Item[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await this.fetchJson<{ items: Item[] }>(`/api/v1/items${query}`);
    return data.items;
  }

  async getItem(itemId: string): Promise<Item> {
    const data = await this.fetchJson<{ item: Item }>(`/api/v1/items/${itemId}`);
    return data.item;
  }

  async createItem(input: ItemCreateInput): Promise<Item> {
    const data = await this.fetchJson<{ item: Item }>("/api/v1/items", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.item;
  }

  async updateItem(itemId: string, input: ItemUpdateInput): Promise<Item> {
    const data = await this.fetchJson<{ item: Item }>(`/api/v1/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return data.item;
  }

  async listItemActivities(itemId: string): Promise<Activity[]> {
    const data = await this.fetchJson<{ activities: Activity[] }>(
      `/api/v1/items/${itemId}/activities`,
    );
    return data.activities;
  }

  async getActorMe(): Promise<Actor> {
    const data = await this.fetchJson<{ actor: Actor }>("/api/v1/actors/me");
    return data.actor;
  }

  async createBrief(input: BriefCreateInput): Promise<Brief> {
    const data = await this.fetchJson<{ brief: Brief }>("/api/v1/briefs", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.brief;
  }

  private async fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("X-Briefs-User-Id", this.userId);
    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }
    if (init.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers,
    });

    const body = await response.text();
    if (!response.ok) {
      throw new BriefsApiError(body || `Request failed: ${response.status}`, response.status);
    }

    return JSON.parse(body) as T;
  }
}

export function createBriefsApiClient(userId: string, apiUrl?: string, accessToken?: string): BriefsApiClient {
  const base = (apiUrl ?? process.env.BRIEFS_API_URL ?? "http://localhost:8001").replace(/\/$/, "");
  return new BriefsApiClient(base, userId, accessToken);
}
