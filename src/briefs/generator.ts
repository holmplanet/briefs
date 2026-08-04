import type { ChangeSet } from "../reasoning/types.js";
import type { BriefSectionDefinition } from "../platform/types.js";

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

export type BriefSection = {
  id: string;
  title: string;
  pack: string;
  bullets: BriefBullet[];
};

export type Brief = {
  userId: string;
  kind: BriefKind;
  generatedAt: string;
  greeting: string;
  bullets: BriefBullet[];
  sections: BriefSection[];
};

const GREETINGS: Record<BriefKind, string> = {
  [BriefKind.MORNING]: "Good morning.",
  [BriefKind.AFTERNOON]: "Good afternoon.",
  [BriefKind.ON_DEMAND]: "Here's your brief.",
  [BriefKind.DELTA]: "Here's what changed.",
};

export class BriefGenerator {
  generate(
    userId: string,
    kind: BriefKind,
    changes: ChangeSet,
    sectionDefinitions: BriefSectionDefinition[] = [],
  ): Brief {
    const bullets = [...changes.insights]
      .sort((a, b) => a.priority - b.priority)
      .map((insight) => ({
        text: insight.message,
        priority: insight.priority,
      }));

    const sections = buildBriefSections(changes, sectionDefinitions);

    return {
      userId,
      kind,
      generatedAt: new Date().toISOString(),
      greeting: GREETINGS[kind],
      bullets,
      sections,
    };
  }
}

function buildBriefSections(
  changes: ChangeSet,
  sectionDefinitions: BriefSectionDefinition[],
): BriefSection[] {
  if (sectionDefinitions.length === 0) {
    return [];
  }

  const bySectionId = new Map(
    sectionDefinitions.map((section) => [
      section.id,
      {
        id: section.id,
        title: section.title,
        pack: section.pack,
        bullets: [] as BriefBullet[],
      },
    ]),
  );

  for (const insight of changes.insights) {
    if (!insight.section) {
      continue;
    }
    const section = bySectionId.get(insight.section);
    if (!section) {
      continue;
    }
    section.bullets.push({
      text: insight.message,
      priority: insight.priority,
    });
  }

  return [...bySectionId.values()]
    .map((section) => ({
      ...section,
      bullets: section.bullets.sort((a, b) => a.priority - b.priority),
    }))
    .filter((section) => section.bullets.length > 0);
}

export const briefGenerator = new BriefGenerator();
