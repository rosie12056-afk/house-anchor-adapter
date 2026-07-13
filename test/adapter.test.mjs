import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runMemoryPortConformance } from "house-toolkit/src/conformance.mjs";
import { AnchorMemoryAdapter } from "../src/index.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function harness() {
  const data = mkdtempSync(join(tmpdir(), "house-anchor-adapter-"));
  const options = {
    anchorRoot: join(root, "test", "fixtures"),
    anchorDataPath: join(data, "anchor"),
    sidecarPath: join(data, "sidecar.db"),
    mapMemory: async (memory) => ({ tag: memory.kind, tier: "long", emotionScore: 0.5, context: "" }),
  };
  return {
    options,
    createPort: async () => new AnchorMemoryAdapter(options),
    reopenPort: async () => new AnchorMemoryAdapter(options),
    closePort: async (port) => port.close(),
  };
}

test("Anchor adapter passes the Runtime Memory Port candidate suite", async () => {
  const setup = harness();
  const report = await runMemoryPortConformance(setup);
  assert.equal(report.ok, true, JSON.stringify(report));
  const adapter = new AnchorMemoryAdapter(setup.options);
  assert.equal(await adapter.anchorCount(), 3);
  const results = await adapter.semanticSearch("older fictional reflection", { associate: false });
  assert.equal(results[0].memory_id, "memory:fictional:older");
  assert.equal(results.some((item) => item.memory_id === "memory:fictional:quarantined"), false);
  await adapter.close();
});

test("instance mapping is required and remains outside the adapter", () => {
  const data = mkdtempSync(join(tmpdir(), "house-anchor-policy-"));
  assert.throws(() => new AnchorMemoryAdapter({ anchorRoot: join(root, "test", "fixtures"), anchorDataPath: join(data, "anchor"), sidecarPath: join(data, "sidecar.db") }), /mapMemory is required/);
});
