import type { ActionExecutionResult, ActionProposal } from "../types.js";

export type ActionExecutor = {
  readonly actionType: string;
  execute(proposal: ActionProposal): Promise<ActionExecutionResult>;
};

export type ActionExecutorRegistry = {
  get(actionType: string): ActionExecutor;
  list(): ActionExecutor[];
  register(executor: ActionExecutor): void;
};
