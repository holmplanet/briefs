import { bootstrap, type AppContext } from "./bootstrap.js";

let runtimePromise: Promise<AppContext> | undefined;

/** Returns the process-local System runtime used by serverless route adapters. */
export function getSystemRuntime(): Promise<AppContext> {
  runtimePromise ??= bootstrap();
  return runtimePromise;
}

/** Test-only reset for consumers that need a fresh in-memory runtime. */
export function resetSystemRuntime(): void {
  runtimePromise = undefined;
}
