import type { BriefTask, BriefTaskStore } from "./types.js";

export class InMemoryBriefTaskStore implements BriefTaskStore {
  private readonly tasks = new Map<string, BriefTask>();

  async save(task: BriefTask): Promise<BriefTask> {
    this.tasks.set(task.id, task);
    return task;
  }

  async get(taskId: string): Promise<BriefTask | undefined> {
    return this.tasks.get(taskId);
  }

  async listForUser(userId: string, status?: BriefTask["status"]): Promise<BriefTask[]> {
    return [...this.tasks.values()]
      .filter((task) => task.userId === userId)
      .filter((task) => (status ? task.status === status : true))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async update(task: BriefTask): Promise<BriefTask> {
    this.tasks.set(task.id, task);
    return task;
  }

  async delete(taskId: string): Promise<boolean> {
    return this.tasks.delete(taskId);
  }

  clear(): void {
    this.tasks.clear();
  }
}
