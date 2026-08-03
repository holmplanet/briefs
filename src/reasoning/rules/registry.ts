import type { ReasoningRule } from "./types.js";
import { scheduleConflictsRule } from "./schedule-conflicts.js";
import { staleDependenciesRule } from "./stale-dependencies.js";
import { taskDeadlinesRule } from "./task-deadlines.js";
import { upcomingEventsRule } from "./upcoming-events.js";
import { weatherConflictsRule } from "./weather-conflicts.js";

const defaultRules: ReasoningRule[] = [
  weatherConflictsRule,
  scheduleConflictsRule,
  staleDependenciesRule,
  taskDeadlinesRule,
  upcomingEventsRule,
];

export class ReasoningRuleRegistry {
  constructor(private readonly rules: ReasoningRule[] = defaultRules) {}

  list(): ReasoningRule[] {
    return [...this.rules];
  }

  register(rule: ReasoningRule): void {
    if (this.rules.some((existing) => existing.name === rule.name)) {
      throw new Error(`Reasoning rule already registered: ${rule.name}`);
    }
    this.rules.push(rule);
  }
}

export const defaultReasoningRuleRegistry = new ReasoningRuleRegistry();
