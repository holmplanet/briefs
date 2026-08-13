import type { ItemCreateInput, QuestionAnswers } from "@briefs/shared";

function textAnswer(answers: QuestionAnswers, key: string): string {
  const value = answers[key];
  return typeof value === "string" ? value.trim() : "";
}

export function buildBriefItemInput(answers: QuestionAnswers): ItemCreateInput {
  const name = textAnswer(answers, "name");
  const outcome = textAnswer(answers, "outcome");
  const context = textAnswer(answers, "context");
  const kind = typeof answers.kind === "string" && answers.kind.trim() ? answers.kind.trim() : "task";

  if (!name || !outcome) {
    throw new Error("A title and outcome are required.");
  }

  return {
    name,
    kind,
    description: [`Outcome\n${outcome}`, context ? `Context\n${context}` : null]
      .filter((section): section is string => Boolean(section))
      .join("\n\n"),
  };
}
