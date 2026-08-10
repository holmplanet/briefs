"use server";

import type { QuestionAnswers } from "@briefs/shared";
import { redirect } from "next/navigation";

import { createItem } from "@/lib/briefs-api";

export async function createBrief(answers: QuestionAnswers) {
  const name = typeof answers.name === "string" ? answers.name.trim() : "";
  const kind = typeof answers.kind === "string" ? answers.kind : "task";
  const outcome = typeof answers.outcome === "string" ? answers.outcome.trim() : "";
  const context = typeof answers.context === "string" ? answers.context.trim() : "";

  if (!name || !outcome) {
    throw new Error("A title and outcome are required.");
  }

  const description = [`Outcome\n${outcome}`, context ? `Context\n${context}` : null]
    .filter(Boolean)
    .join("\n\n");

  const item = await createItem({ name, kind, description });
  redirect(`/items/${item.id}`);
}
