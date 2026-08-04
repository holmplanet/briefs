import type { Brief, BriefTask } from "./types";

type ApiErrorBody = {
  error?: string | Record<string, unknown>;
};

async function parseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (typeof body.error === "string") {
    return body.error;
  }
  return `Request failed (${response.status})`;
}

async function apiFetch<T>(path: string, userId: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Brief-User-Id": userId,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

export async function listTasks(userId: string): Promise<BriefTask[]> {
  const { tasks } = await apiFetch<{ tasks: BriefTask[] }>("/api/v1/tasks", userId);
  return tasks;
}

export async function createTask(
  userId: string,
  input: { label: string; dueAt?: string },
): Promise<BriefTask> {
  const { task } = await apiFetch<{ task: BriefTask }>("/api/v1/tasks", userId, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return task;
}

export async function completeTask(userId: string, taskId: string): Promise<BriefTask> {
  const { task } = await apiFetch<{ task: BriefTask }>(`/api/v1/tasks/${taskId}`, userId, {
    method: "PATCH",
    body: JSON.stringify({ status: "done" }),
  });
  return task;
}

export async function generateBrief(userId: string): Promise<Brief> {
  const { brief } = await apiFetch<{ brief: Brief }>(
    "/api/v1/brief?kind=on_demand&syncFirst=true",
    userId,
  );
  return brief;
}
