import { stubPack } from "../packs/stub.js";
import { getPackRegistry } from "./runtime.js";

export function initializePlatform(): void {
  const registry = getPackRegistry();
  if (registry.listPacks().some((pack) => pack.id === stubPack.id)) {
    return;
  }
  registry.registerPack(stubPack);
}
