import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AnchorMemoryAdapter } from "../src/index.mjs";

test("adapter stores and retrieves through the real Anchor upstream", { skip: !process.env.ANCHOR_UPSTREAM_PATH, timeout: 180000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), "house-anchor-real-"));
  const adapter = new AnchorMemoryAdapter({
    anchorRoot: process.env.ANCHOR_UPSTREAM_PATH,
    anchorDataPath: join(root, "anchor"),
    sidecarPath: join(root, "sidecar.db"),
    timeoutMs: 180000,
    mapMemory: async () => ({ tag: "fictional", tier: "long", emotionScore: 0.5, context: "" }),
  });
  await adapter.putMemory({
    operationId: "operation:fictional:real-anchor",
    runId: "run:fictional:real-anchor",
    memory: { memory_id: "memory:fictional:real-anchor", subject_id: "agent:lantern", kind: "reflection", body: "A copper observatory watches a quiet fictional harbor.", source_refs: [], evidence_refs: [], status: "active", created_at: "2032-04-05T09:00:00.000Z" },
  });
  const results = await adapter.semanticSearch("copper observatory harbor", { associate: false });
  assert.equal(results.some((item) => item.memory_id === "memory:fictional:real-anchor"), true);
  await adapter.close();
});
