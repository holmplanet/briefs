"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { BriefPanel } from "@/components/brief-panel";
import { TaskInbox } from "@/components/task-inbox";
import { createTask, generateBrief, listTasks } from "@/lib/api";
import type { Brief, BriefTask } from "@/lib/types";

const USER_STORAGE_KEY = "brief-user-id";

export function HomePage() {
  const [userId, setUserId] = useState("carter");
  const [tasks, setTasks] = useState<BriefTask[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [label, setLabel] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingBrief, setLoadingBrief] = useState(false);

  const refreshTasks = useCallback(async () => {
    setLoadingTasks(true);
    setError(null);
    try {
      const nextTasks = await listTasks(userId);
      setTasks(nextTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [userId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      setUserId(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(USER_STORAGE_KEY, userId);
    setBrief(null);
    void refreshTasks();
  }, [userId, refreshTasks]);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createTask(userId, {
        label: label.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      setLabel("");
      setDueAt("");
      setStatus("Task created.");
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function handleGenerateBrief() {
    setLoadingBrief(true);
    setError(null);
    try {
      const nextBrief = await generateBrief(userId);
      setBrief(nextBrief);
      setStatus("Brief generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate brief");
    } finally {
      setLoadingBrief(false);
    }
  }

  return (
    <>
      <header className="header">
        <div>
          <p className="eyebrow">Holmplanet Brief</p>
          <h1>Task inbox</h1>
        </div>
        <div className="user-panel">
          <label htmlFor="userId">User</label>
          <input
            id="userId"
            value={userId}
            onChange={(event) => setUserId(event.target.value.trim() || "default")}
          />
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Tasks</h2>
            <button type="button" onClick={() => void refreshTasks()} disabled={loadingTasks}>
              {loadingTasks ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <form className="task-form" onSubmit={(event) => void handleCreateTask(event)}>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="What needs doing?"
              required
            />
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
            <button type="submit">Add task</button>
          </form>

          <TaskInbox userId={userId} tasks={tasks} onChanged={refreshTasks} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Brief</h2>
            <button type="button" onClick={() => void handleGenerateBrief()} disabled={loadingBrief}>
              {loadingBrief ? "Generating…" : "Generate"}
            </button>
          </div>
          <BriefPanel brief={brief} />
        </section>
      </main>

      <p className={`status ${error ? "error" : ""}`} role="status">
        {error ?? status}
      </p>
    </>
  );
}
