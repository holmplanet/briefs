import type { Activity } from "@briefs/shared/activity";
import type { Actor } from "@briefs/shared/actor";
import type { Item, ItemCreateInput, ItemUpdateInput } from "@briefs/shared/item";

import type { CliConfig } from "./config.js";

export type HealthResponse = {
  status: string;
  service: string;
  storage?: string;
};

export class BriefsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "BriefsApiError";
  }
}

export class BriefsClient {
  constructor(private readonly config: CliConfig) {}

  async health(): Promise<HealthResponse> {
    return this.fetchJson<HealthResponse>("/health", { auth: false });
  }

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

  private async fetchJson<T>(
    path: string,
    options: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    const { auth = true, ...init } = options;
    const headers = new Headers(init.headers);

    if (auth) {
      headers.set("X-Briefs-User-Id", this.config.userId);
    }

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${this.config.apiUrl}${path}`, {
      ...init,
      headers,
    });

    const body = await response.text();

    if (!response.ok) {
      throw new BriefsApiError(
        body || `Request failed: ${response.status}`,
        response.status,
        body,
      );
    }

    if (!body) {
      return {} as T;
    }

    return JSON.parse(body) as T;
  }
}
