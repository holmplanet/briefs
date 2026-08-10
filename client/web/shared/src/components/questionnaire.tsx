"use client";

import * as React from "react";
import type { QuestionAnswers, QuestionFlow } from "@briefs/shared";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";

export type QuestionnaireProps = {
  flow: QuestionFlow;
  onComplete: (answers: QuestionAnswers) => void | Promise<void>;
  submitLabel?: string;
};

export function Questionnaire({ flow, onComplete, submitLabel = "Create brief" }: QuestionnaireProps) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<QuestionAnswers>({});
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const question = flow.questions[step];
  const currentValue = answers[question.id] ?? "";
  const isLastStep = step === flow.questions.length - 1;
  const progress = ((step + 1) / flow.questions.length) * 100;

  function updateAnswer(value: string | string[]) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setError(null);
  }

  function canContinue() {
    if (!question.required) return true;
    if (Array.isArray(currentValue)) return currentValue.length > 0;
    return currentValue.trim().length > 0;
  }

  async function handleNext() {
    if (!canContinue()) {
      setError("Answer this question to continue, or use Back to review an earlier step.");
      return;
    }

    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete(answers);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not save this brief.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl overflow-visible border-white/10 bg-card/80 shadow-2xl shadow-blue-950/20">
      <div className="h-1.5 overflow-hidden rounded-t-xl bg-muted">
        <div className="h-full bg-gradient-to-r from-blue-400 to-violet-400 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <CardHeader className="gap-3 p-6 pb-3 sm:p-8 sm:pb-4">
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>{flow.title}</span>
          <span>{step + 1} of {flow.questions.length}</span>
        </div>
        <CardTitle className="text-2xl tracking-[-0.03em] sm:text-3xl">{question.label}</CardTitle>
        {question.description ? <CardDescription>{question.description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-3 sm:p-8 sm:pt-4">
        {question.type === "single" ? (
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={question.label}>
            {question.options.map((option) => {
              const selected = currentValue === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updateAnswer(option.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all hover:border-blue-300/50 hover:bg-blue-400/5",
                    selected ? "border-blue-300 bg-blue-400/10 ring-2 ring-blue-400/20" : "border-border/70 bg-background/20",
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.description ? <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span> : null}
                </button>
              );
            })}
          </div>
        ) : question.multiline ? (
          <Textarea value={typeof currentValue === "string" ? currentValue : ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} rows={6} autoFocus />
        ) : (
          <Input value={typeof currentValue === "string" ? currentValue : ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} autoFocus />
        )}

        {error ? <p className="text-sm text-red-300" role="alert">{error}</p> : null}

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
          <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || isSubmitting}>
            Back
          </Button>
          <Button type="button" className="btn-accent" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isLastStep ? submitLabel : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
