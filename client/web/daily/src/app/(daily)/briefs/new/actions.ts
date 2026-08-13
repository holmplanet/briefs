"use server";

import type { QuestionAnswers } from "@briefs/shared";
import { redirect } from "next/navigation";

import { createItem } from "@/lib/briefs-api";
import { buildBriefItemInput } from "@/lib/brief-intake";

export async function createBrief(answers: QuestionAnswers) {
  const item = await createItem(buildBriefItemInput(answers));
  redirect(`/items/${item.id}`);
}
