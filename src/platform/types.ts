import type { ReasoningRule } from "../reasoning/rules/types.js";

export type BriefSectionDefinition = {
  id: string;
  pack: string;
  title: string;
};

export type BriefPack = {
  id: string;
  name: string;
  register(registry: PackRegistrar): void;
};

export type PackRegistrar = {
  registerReasoningRule(rule: ReasoningRule): void;
  registerBriefSection(section: BriefSectionDefinition): void;
};
