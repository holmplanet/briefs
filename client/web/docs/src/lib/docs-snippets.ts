import { getBriefsApiBase, getBriefsUserId } from "@/lib/briefs-api";

export function docsApiBase(): string {
  return getBriefsApiBase();
}

export function docsUserHeader(): string {
  return getBriefsUserId();
}

export function curlHealth(): string {
  return `curl ${docsApiBase()}/health`;
}

export function curlListItems(): string {
  return `curl -H "X-Briefs-User-Id: ${docsUserHeader()}" \\
  ${docsApiBase()}/api/v1/items`;
}

export function curlCreateItem(): string {
  return `curl -H "X-Briefs-User-Id: ${docsUserHeader()}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Ship items UI","kind":"task"}' \\
  ${docsApiBase()}/api/v1/items`;
}

export function curlActorMe(): string {
  return `curl -H "X-Briefs-User-Id: ${docsUserHeader()}" \\
  ${docsApiBase()}/api/v1/actors/me`;
}

export function curlItemActivities(itemId = "<item-id>"): string {
  return `curl -H "X-Briefs-User-Id: ${docsUserHeader()}" \\
  ${docsApiBase()}/api/v1/items/${itemId}/activities`;
}
