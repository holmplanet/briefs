import type { Brief } from "./generator.js";
import type { ChangeSet } from "../reasoning/types.js";

export class BriefStore {
  private readonly briefs = new Map<string, Brief>();
  private readonly changeSets = new Map<string, ChangeSet>();

  get(userId: string): Brief | undefined {
    return this.briefs.get(userId);
  }

  getChangeSet(userId: string): ChangeSet | undefined {
    return this.changeSets.get(userId);
  }

  save(brief: Brief, changeSet: ChangeSet): Brief {
    this.briefs.set(brief.userId, brief);
    this.changeSets.set(brief.userId, changeSet);
    return brief;
  }

  clear(): void {
    this.briefs.clear();
    this.changeSets.clear();
  }
}

export const briefStore = new BriefStore();
