import { ActionType, type ActionExecutionResult, type ActionProposal } from "../types.js";
import type { ActionExecutor, ActionExecutorRegistry } from "./types.js";

function draftResult(
  proposal: ActionProposal,
  message: string,
  draft: Record<string, unknown>,
): ActionExecutionResult {
  return {
    mode: "draft",
    actionType: proposal.actionType,
    summary: proposal.summary,
    message,
    draft,
  };
}

export const draftReplyExecutor: ActionExecutor = {
  actionType: ActionType.DRAFT_REPLY,
  async execute(proposal) {
    const to = String(proposal.payload.to ?? "recipient");
    const subject = String(proposal.payload.subject ?? "Re: your message");
    const body = String(proposal.payload.body ?? proposal.payload.draft ?? proposal.summary);

    return draftResult(proposal, `Draft reply prepared for ${to}. No message was sent.`, {
      to,
      subject,
      body,
    });
  },
};

export const draftRescheduleExecutor: ActionExecutor = {
  actionType: ActionType.DRAFT_RESCHEDULE,
  async execute(proposal) {
    const eventLabel = String(proposal.payload.eventLabel ?? proposal.payload.eventId ?? "event");
    const newStart = String(proposal.payload.newStart ?? "unspecified");
    const newEnd = String(proposal.payload.newEnd ?? newStart);

    return draftResult(
      proposal,
      `Draft reschedule prepared for “${eventLabel}”. No calendar write was performed.`,
      {
        eventLabel,
        newStart,
        newEnd,
        reason: proposal.payload.reason,
      },
    );
  },
};

export const draftNotifyExecutor: ActionExecutor = {
  actionType: ActionType.DRAFT_NOTIFY,
  async execute(proposal) {
    const recipient = String(proposal.payload.recipient ?? "team");
    const message = String(proposal.payload.message ?? proposal.summary);

    return draftResult(
      proposal,
      `Draft notification prepared for ${recipient}. Nothing was delivered.`,
      {
        recipient,
        message,
        channel: proposal.payload.channel ?? "unspecified",
      },
    );
  },
};

export const logNoteExecutor: ActionExecutor = {
  actionType: ActionType.LOG_NOTE,
  async execute(proposal) {
    return draftResult(proposal, "Note recorded as a draft action. No external write occurred.", {
      note: String(proposal.payload.note ?? proposal.summary),
      tags: proposal.payload.tags ?? [],
    });
  },
};

export const fallbackDraftExecutor: ActionExecutor = {
  actionType: "*",
  async execute(proposal) {
    return draftResult(
      proposal,
      `Draft preview prepared for ${proposal.actionType}. No external write occurred.`,
      {
        payload: proposal.payload,
      },
    );
  },
};

const defaultExecutors: ActionExecutor[] = [
  draftReplyExecutor,
  draftRescheduleExecutor,
  draftNotifyExecutor,
  logNoteExecutor,
];

export class DefaultActionExecutorRegistry implements ActionExecutorRegistry {
  private readonly executors = new Map<string, ActionExecutor>();

  constructor(executors: ActionExecutor[] = defaultExecutors) {
    for (const executor of executors) {
      this.executors.set(executor.actionType, executor);
    }
  }

  register(executor: ActionExecutor): void {
    this.executors.set(executor.actionType, executor);
  }

  get(actionType: string): ActionExecutor {
    return this.executors.get(actionType) ?? fallbackDraftExecutor;
  }

  list(): ActionExecutor[] {
    return [...this.executors.values()];
  }
}

export const defaultActionExecutorRegistry = new DefaultActionExecutorRegistry();
