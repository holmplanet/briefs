import { buildTaskNode } from "../../../graph/tasks/build.js";
import type { BriefTask } from "../../../tasks/types.js";
import type { NormalizedSyncPayload } from "../../types.js";

export const BRIEF_TASK_SOURCE = "brief";

export function mapBriefTasksToPayload(tasks: BriefTask[]): NormalizedSyncPayload {
  return {
    nodes: tasks.map((task) =>
      buildTaskNode({
        externalId: task.id,
        label: task.label,
        status: task.status,
        dueAt: task.dueAt,
        scheduledAt: task.scheduledAt,
        completedAt: task.completedAt,
        priority: task.priority,
        description: task.description,
        source: BRIEF_TASK_SOURCE,
      }),
    ),
    edges: [],
  };
}
