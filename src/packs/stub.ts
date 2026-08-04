import { InsightKind } from "../reasoning/types.js";
import type { BriefPack } from "../platform/types.js";

export const STUB_PACK_ID = "stub";

export const stubPack: BriefPack = {
  id: STUB_PACK_ID,
  name: "Stub Pack",
  register(registry) {
    registry.registerBriefSection({
      id: "stub-demo",
      pack: STUB_PACK_ID,
      title: "Stub Pack Demo",
    });

    registry.registerReasoningRule({
      name: "stub-pack-demo",
      analyze(context) {
        const stubNodes = context.snapshot.nodes.filter(
          (node) => node.data.pack === STUB_PACK_ID,
        );
        if (stubNodes.length === 0) {
          return [];
        }

        return [
          {
            id: "stub-pack-active",
            kind: InsightKind.REMINDER,
            message: `Stub pack sees ${stubNodes.length} registered node(s).`,
            priority: 3,
            relatedNodeIds: stubNodes.map((node) => node.id),
            pack: STUB_PACK_ID,
            section: "stub-demo",
          },
        ];
      },
    });
  },
};
