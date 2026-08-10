import { defineTool } from "eve/tools";
import { z } from "zod";

import { listItems } from "../lib/system-client.js";

export default defineTool({
  description: "List the authenticated user’s durable Briefs items. Use this to inspect current work before answering what is on the user’s plate.",
  inputSchema: z.object({
    status: z.string().optional().describe("Optional item status filter, such as open or done."),
  }),
  async execute({ status }) {
    return { items: await listItems(status) };
  },
});
