export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type BriefTask = {
  id: string;
  userId: string;
  label: string;
  status: TaskStatus;
  dueAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  priority?: TaskPriority;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type BriefBullet = {
  text: string;
  priority: number;
};

export type BriefSection = {
  id: string;
  title: string;
  pack: string;
  bullets: BriefBullet[];
};

export type Brief = {
  userId: string;
  kind: string;
  generatedAt: string;
  greeting: string;
  bullets: BriefBullet[];
  sections: BriefSection[];
};
