const apiBase = process.env.NEXT_PUBLIC_BRIEFS_API_URL ?? "http://localhost:8000";

export function getBriefsApiBase(): string {
  return apiBase.replace(/\/$/, "");
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
