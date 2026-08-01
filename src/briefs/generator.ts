import type { ChangeSet } from "../reasoning/types.js";

export const BriefKind = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  ON_DEMAND: "on_demand",
  DELTA: "delta",
} as const;

export type BriefKind = (typeof BriefKind)[keyof typeof BriefKind];

export type BriefBullet = {
  text: string;
  priority: number;
};

export type Brief = {
  userId: string;
  kind: BriefKind;
  generatedAt: string;
  greeting: string;
  bullets: BriefBullet[];
};

const GREETINGS: Record<BriefKind, string> = {
  [BriefKind.MORNING]: "Good morning.",
  [BriefKind.AFTERNOON]: "Good afternoon.",
  [BriefKind.ON_DEMAND]: "Here's your brief.",
  [BriefKind.DELTA]: "Here's what changed.",
};

export class BriefGenerator {
  generate(userId: string, kind: BriefKind, changes: ChangeSet): Brief {
    const bullets = [...changes.insights]
      .sort((a, b) => a.priority - b.priority)
      .map((insight) => ({
        text: insight.message,
        priority: insight.priority,
      }));

    return {
      userId,
      kind,
      generatedAt: new Date().toISOString(),
      greeting: GREETINGS[kind],
      bullets,
    };
  }
}

export const briefGenerator = new BriefGenerator();
