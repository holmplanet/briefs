import { defineTool } from "eve/tools";
import { z } from "zod";

import { createItem } from "../lib/system-client.js";

export default defineTool({
  description: "Create one durable Briefs item after the user has clearly asked to capture it.",
  inputSchema: z.object({
    name: z.string().min(1).max(500),
    kind: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  }),
  async execute(input) {
    return { item: await createItem(input) };
  },
});
