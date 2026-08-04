"use client";

import { useState } from "react";

import { completeTask } from "@/lib/api";
import type { BriefTask } from "@/lib/types";

type TaskInboxProps = {
  userId: string;
  tasks: BriefTask[];
  onChanged: () => Promise<void>;
};

function formatDueAt(value?: string): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleString();
}

export function TaskInbox({ userId, tasks, onChanged }: TaskInboxProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleComplete(taskId: string) {
    setPendingId(taskId);
    try {
      await completeTask(userId, taskId);
      await onChanged();
    } finally {
      setPendingId(null);
    }
  }

  if (tasks.length === 0) {
    return <p className="muted">No tasks yet.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className={`task-item ${task.status === "done" ? "done" : ""}`}>
          <strong>{task.label}</strong>
          <div className="task-meta">
            {task.status}
            {task.dueAt ? ` · due ${formatDueAt(task.dueAt)}` : ""}
          </div>
          {task.status !== "done" ? (
            <div className="task-actions">
              <button
                type="button"
                disabled={pendingId === task.id}
                onClick={() => void handleComplete(task.id)}
              >
                {pendingId === task.id ? "Saving…" : "Complete"}
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
