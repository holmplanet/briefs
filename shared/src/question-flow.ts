import { z } from "zod";

export const questionOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

export const questionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("single"),
    label: z.string().min(1),
    description: z.string().optional(),
    required: z.boolean().default(true),
    options: z.array(questionOptionSchema).min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("text"),
    label: z.string().min(1),
    description: z.string().optional(),
    required: z.boolean().default(true),
    placeholder: z.string().optional(),
    multiline: z.boolean().default(false),
  }),
]);

export const questionFlowSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  questions: z.array(questionSchema).min(1),
  output: z.enum(["brief", "item", "assessment"]),
});

export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionFlow = z.infer<typeof questionFlowSchema>;
export type QuestionAnswers = Record<string, string | string[]>;

export const createBriefFlow: QuestionFlow = {
  id: "create-brief",
  version: 1,
  title: "Create a brief",
  description: "Answer a few questions and we’ll turn the shape of your intent into durable work.",
  output: "brief",
  questions: [
    {
      id: "kind",
      type: "single",
      label: "What are you capturing?",
      description: "Choose the kind of durable thing this should become.",
      required: true,
      options: [
        { value: "task", label: "Task", description: "Something you need to do." },
        { value: "project", label: "Project", description: "A larger outcome with multiple steps." },
        { value: "decision", label: "Decision", description: "A choice you need to make or remember." },
        { value: "idea", label: "Idea", description: "A possibility worth keeping around." },
      ],
    },
    {
      id: "name",
      type: "text",
      label: "What should we call it?",
      description: "Use a short title you’ll recognize later.",
      required: true,
      placeholder: "e.g. Plan the next Briefs onboarding flow",
      multiline: false,
    },
    {
      id: "outcome",
      type: "text",
      label: "What does done look like?",
      description: "Describe the outcome, not just the activity.",
      required: true,
      placeholder: "e.g. A new user can connect MCP and create their first brief.",
      multiline: true,
    },
    {
      id: "context",
      type: "text",
      label: "What context should stay attached?",
      description: "Add constraints, links, or anything future-you will need.",
      required: false,
      placeholder: "Optional context",
      multiline: true,
    },
  ],
};
