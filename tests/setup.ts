import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";

beforeEach(() => {
  resetGraphStore();
  setGraphStore(new InMemoryGraphStore());
});
