import type { ReasoningRule } from "../reasoning/rules/types.js";
import type { BriefPack, BriefSectionDefinition, PackRegistrar } from "./types.js";

export class PackRegistry implements PackRegistrar {
  private readonly packs = new Map<string, BriefPack>();
  private readonly rules: ReasoningRule[] = [];
  private readonly sections: BriefSectionDefinition[] = [];

  registerPack(pack: BriefPack): void {
    if (this.packs.has(pack.id)) {
      throw new Error(`Pack already registered: ${pack.id}`);
    }
    this.packs.set(pack.id, pack);
    pack.register(this);
  }

  registerReasoningRule(rule: ReasoningRule): void {
    if (this.rules.some((existing) => existing.name === rule.name)) {
      throw new Error(`Reasoning rule already registered: ${rule.name}`);
    }
    this.rules.push(rule);
  }

  registerBriefSection(section: BriefSectionDefinition): void {
    if (this.sections.some((existing) => existing.id === section.id)) {
      throw new Error(`Brief section already registered: ${section.id}`);
    }
    this.sections.push(section);
  }

  listPacks(): BriefPack[] {
    return [...this.packs.values()];
  }

  listReasoningRules(): ReasoningRule[] {
    return [...this.rules];
  }

  listBriefSections(): BriefSectionDefinition[] {
    return [...this.sections];
  }

  clear(): void {
    this.packs.clear();
    this.rules.length = 0;
    this.sections.length = 0;
  }
}
