import type { Brief } from "./generator.js";

export class BriefStore {
  private readonly briefs = new Map<string, Brief>();

  get(userId: string): Brief | undefined {
    return this.briefs.get(userId);
  }

  save(brief: Brief): Brief {
    this.briefs.set(brief.userId, brief);
    return brief;
  }

  clear(): void {
    this.briefs.clear();
  }
}

export const briefStore = new BriefStore();
