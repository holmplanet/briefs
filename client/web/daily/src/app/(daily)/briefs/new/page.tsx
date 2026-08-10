import { createBriefFlow } from "@briefs/shared";
import { Questionnaire } from "@briefs/web-shared";

import { createBrief } from "./actions";

export default function NewBriefPage() {
  return (
    <div className="flex flex-col gap-8 pb-16 pt-4">
      <section className="mx-auto w-full max-w-2xl space-y-3">
        <p className="text-sm font-medium text-blue-300/80">Briefs Daily</p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Start with intent</h1>
        <p className="max-w-xl text-muted-foreground">{createBriefFlow.description}</p>
      </section>
      <Questionnaire flow={createBriefFlow} onComplete={createBrief} />
    </div>
  );
}
