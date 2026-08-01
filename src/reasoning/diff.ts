import type { Insight } from "./types.js";

export function diffInsights(previous: Insight[], current: Insight[]): Insight[] {
  const previousById = new Map(previous.map((insight) => [insight.id, insight]));

  return current.filter((insight) => {
    const prior = previousById.get(insight.id);
    return !prior || prior.message !== insight.message;
  });
}
