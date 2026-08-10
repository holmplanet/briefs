import { EveChat } from "@/components/eve-chat";

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-8 pb-16">
      <section className="space-y-2">
        <p className="text-sm font-medium text-blue-300/80">Briefs Daily</p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Talk to Eve</h1>
        <p className="max-w-2xl text-muted-foreground">
          Ask about your Briefs items or generate an items-only daily brief. Eve does not have
          calendar or email context yet.
        </p>
      </section>
      <EveChat />
    </div>
  );
}
