import { resolve } from "node:path";
import { SQLiteMemoryAdapter, assertMemoryPortCandidate } from "house-runtime";
import { AnchorPythonBridge } from "./python-bridge.mjs";

function validateMapping(mapping) {
  if (!mapping || typeof mapping !== "object") throw new Error("mapMemory must return an object");
  if (typeof mapping.tag !== "string" || !mapping.tag) throw new Error("mapMemory.tag is required");
  if (!new Set(["core", "long", "short"]).has(mapping.tier)) throw new Error("mapMemory.tier must be core, long, or short");
  if (typeof mapping.emotionScore !== "number" || mapping.emotionScore < 0 || mapping.emotionScore > 1) throw new Error("mapMemory.emotionScore must be from 0 to 1");
  if (mapping.context != null && typeof mapping.context !== "string") throw new Error("mapMemory.context must be a string when provided");
  return mapping;
}

export class AnchorMemoryAdapter {
  constructor({ anchorRoot, anchorDataPath, sidecarPath, mapMemory, pythonCommand = "python3", timeoutMs = 120000 }) {
    if (typeof mapMemory !== "function") throw new Error("mapMemory is required; instance policy must choose Anchor tag, tier, and emotion score");
    this.mapMemory = mapMemory;
    this.sidecar = assertMemoryPortCandidate(new SQLiteMemoryAdapter(resolve(sidecarPath)));
    this.bridge = new AnchorPythonBridge({ anchorRoot: resolve(anchorRoot), dbPath: resolve(anchorDataPath), pythonCommand, timeoutMs });
  }

  async health() {
    const [sidecar, anchor] = await Promise.all([this.sidecar.health(), this.bridge.request("ping")]);
    return { ok: sidecar.ok === true && anchor?.ok === true, adapter: "anchor-memory", schema_version: "candidate-v1", anchor_count: anchor.count };
  }

  async queryMemories(options) { return this.sidecar.queryMemories(options); }
  async latestResignature(options) { return this.sidecar.latestResignature(options); }
  async queryResignatures(options) { return this.sidecar.queryResignatures(options); }

  async putMemory(input) {
    const stored = await this.sidecar.putMemory(input);
    if (stored.status === "active") {
      const mapping = validateMapping(await this.mapMemory(structuredClone(stored)));
      await this.bridge.request("store", {
        memory_id: stored.memory_id,
        text: stored.body,
        tag: mapping.tag,
        tier: mapping.tier,
        emotion_score: mapping.emotionScore,
        context: mapping.context || "",
      });
    }
    return stored;
  }

  async appendResignature(input) {
    return this.sidecar.appendResignature(input);
  }

  async semanticSearch(query, { limit = 5, tag = null, associate = true, learn = false } = {}) {
    if (typeof query !== "string" || !query.trim()) throw new Error("query is required");
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("limit must be from 1 to 100");
    return this.bridge.request("search", { query, limit, tag, associate, learn });
  }

  async anchorCount() { return this.bridge.request("count"); }

  async close() {
    this.sidecar.close();
    await this.bridge.close();
  }
}
