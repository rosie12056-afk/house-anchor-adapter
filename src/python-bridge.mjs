import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

export class AnchorPythonBridge {
  #nextId = 1;
  #pending = new Map();
  #closed = false;
  #stderr = "";

  constructor({ anchorRoot, dbPath, pythonCommand = "python3", timeoutMs = 120000 }) {
    if (typeof anchorRoot !== "string" || !anchorRoot) throw new Error("anchorRoot is required");
    if (typeof dbPath !== "string" || !dbPath) throw new Error("Anchor dbPath is required");
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new Error("timeoutMs must be positive");
    const worker = fileURLToPath(new URL("../python/bridge.py", import.meta.url));
    this.timeoutMs = timeoutMs;
    this.child = spawn(pythonCommand, ["-u", worker, "--anchor-root", anchorRoot, "--db-path", dbPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    createInterface({ input: this.child.stdout }).on("line", (line) => this.#receive(line));
    this.child.stderr.on("data", (chunk) => { this.#stderr = `${this.#stderr}${chunk}`.slice(-4000); });
    this.child.on("exit", (code) => {
      const error = Object.assign(new Error(`Anchor worker exited with code ${code}`), { code: "E_ANCHOR_WORKER_EXIT" });
      for (const pending of this.#pending.values()) pending.reject(error);
      this.#pending.clear();
      this.#closed = true;
    });
  }

  request(operation, params = {}) {
    if (this.#closed) return Promise.reject(Object.assign(new Error("Anchor worker is closed"), { code: "E_ANCHOR_WORKER_CLOSED" }));
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(Object.assign(new Error(`Anchor operation timed out: ${operation}`), { code: "E_ANCHOR_TIMEOUT" }));
      }, this.timeoutMs);
      this.#pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify({ id, operation, params })}\n`);
    });
  }

  #receive(line) {
    let response;
    try {
      response = JSON.parse(line);
    } catch {
      return;
    }
    const pending = this.#pending.get(response.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.#pending.delete(response.id);
    if (response.ok) pending.resolve(response.result);
    else pending.reject(Object.assign(new Error(response.error?.message || "Anchor operation failed"), { code: response.error?.code || "E_ANCHOR_OPERATION" }));
  }

  async close() {
    if (this.#closed) return;
    try {
      await this.request("close");
    } finally {
      this.#closed = true;
      this.child.stdin.end();
      if (this.child.exitCode == null) this.child.kill("SIGTERM");
    }
  }
}
