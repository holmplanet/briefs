import {
  BriefKind,
  StitchStatus,
  type Brief,
  type BriefBullet,
  type BriefKind as BriefKindType,
  type Stitch,
} from "@briefs/shared";

export function buildBriefContent(options: {
  kind: BriefKindType;
  stitches: Stitch[];
  previousBrief?: Brief;
}): {
  bullets: BriefBullet[];
  relatedStitchIds: string[];
  headline?: string;
  greeting: string;
} {
  const { kind, stitches, previousBrief } = options;
  const greeting = greetingForKind(kind);
  const active = stitches.filter(
    (stitch) => stitch.status === StitchStatus.OPEN || stitch.status === StitchStatus.IN_PROGRESS,
  );

  if (active.length === 0) {
    return {
      greeting,
      headline: "Nothing on the loom",
      bullets: [
        {
          text: "No open stitches. Add stitches, then brief me again.",
          priority: 2,
        },
      ],
      relatedStitchIds: [],
    };
  }

  const sorted = [...active].sort((a, b) => scoreStitch(b) - scoreStitch(a));
  const bullets: BriefBullet[] = sorted.slice(0, 8).map((stitch, index) => ({
    text: formatStitchBullet(stitch),
    priority: index < 3 ? 1 : 2,
  }));

  if (previousBrief) {
    const since = new Date(previousBrief.generatedAt).toLocaleString();
    bullets.push({
      text: `Since your last brief (${since}), ${active.length} stitch(es) are still open.`,
      priority: 3,
    });
  }

  return {
    greeting,
    headline: `${active.length} open stitch${active.length === 1 ? "" : "es"}`,
    bullets,
    relatedStitchIds: sorted.slice(0, 8).map((stitch) => stitch.id),
  };
}

function greetingForKind(kind: BriefKindType): string {
  switch (kind) {
    case BriefKind.MORNING:
      return "Good morning. Here's your brief.";
    case BriefKind.TRAVEL:
      return "Here's your travel brief.";
    default:
      return "Here's your brief.";
  }
}

function scoreStitch(stitch: Stitch): number {
  let score = 0;
  if (stitch.priority === "urgent") score += 40;
  if (stitch.priority === "high") score += 30;
  if (stitch.priority === "normal") score += 10;
  if (stitch.dueAt) {
    const dueMs = Date.parse(stitch.dueAt);
    if (!Number.isNaN(dueMs)) {
      const daysUntil = (dueMs - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntil < 0) score += 50;
      else if (daysUntil < 1) score += 35;
      else if (daysUntil < 3) score += 20;
    }
  }
  if (stitch.status === StitchStatus.IN_PROGRESS) score += 15;
  return score;
}

function formatStitchBullet(stitch: Stitch): string {
  const parts = [stitch.label];
  if (stitch.dueAt) {
    const due = new Date(stitch.dueAt);
    if (!Number.isNaN(due.getTime())) {
      parts.push(`(due ${due.toLocaleDateString()})`);
    }
  }
  if (stitch.priority && stitch.priority !== "normal") {
    parts.push(`[${stitch.priority}]`);
  }
  return parts.join(" ");
}
