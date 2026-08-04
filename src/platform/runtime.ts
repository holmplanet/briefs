import { PackRegistry } from "./pack-registry.js";

let packRegistry: PackRegistry | undefined;

export function getPackRegistry(): PackRegistry {
  if (!packRegistry) {
    packRegistry = new PackRegistry();
  }
  return packRegistry;
}

export function setPackRegistry(registry: PackRegistry): void {
  packRegistry = registry;
}

export function resetPackRegistry(): void {
  packRegistry = undefined;
}
