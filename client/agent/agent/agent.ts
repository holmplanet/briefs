import { defineAgent } from "eve";

export default defineAgent({
  model: process.env.BRIEFS_EVE_MODEL ?? "anthropic/claude-sonnet-4.6",
});
