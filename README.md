# House Anchor Adapter

Maintenance release `0.1.0-rc.2` preserves the existing maturity and document profiles. See [CHANGELOG.md](CHANGELOG.md) for dependency changes and consumer lockfile guidance.

House Anchor Adapter connects the House Runtime v0.3 Memory Port candidate to [Anchor Memory](https://github.com/limen-threshold/anchor-memory) without copying or forking Anchor source code.

This repository is a release candidate. It contains no real House data, Keel, prompt, schedule, identity, connector, or private configuration.

## Boundary

- House protocol records, quarantine state, operation idempotency, and the atomic Resignature chain live in a dedicated SQLite sidecar.
- Only active memory bodies are mirrored into Anchor for graph and semantic retrieval. Quarantined records are never sent to Anchor.
- Resignatures remain House records. They are not rewritten as Anchor annotations because the two systems have different transaction and idempotency guarantees.
- `mapMemory()` is required Instance configuration. The adapter does not choose emotional weight, tier, tag, or relationship meaning.
- Anchor remains an external MIT-licensed dependency and is not bundled here.

## Install

```bash
git clone https://github.com/limen-threshold/anchor-memory.git
npm install
```

Anchor's Python dependencies must be installed in the selected Python environment. See the upstream Anchor README.

## Use

```js
import { AnchorMemoryAdapter } from "house-anchor-adapter";

const adapter = new AnchorMemoryAdapter({
  anchorRoot: "/path/to/anchor-memory",
  anchorDataPath: "/path/to/instance/anchor-data",
  sidecarPath: "/path/to/instance/house-anchor-sidecar.db",
  mapMemory: async (memory) => ({
    tag: memory.kind,
    tier: "long",
    emotionScore: 0.5,
    context: ""
  })
});
```

Pass `adapter` as House Runtime's `memoryAdapter`. `semanticSearch()` is an optional Anchor-specific extension; the standard Memory Port methods remain portable.

## Verification

```bash
npm run check
ANCHOR_UPSTREAM_PATH=/path/to/anchor-memory npm run test:anchor
```

The normal test suite uses a fictional local Anchor-compatible fixture and runs the shared House Toolkit Memory Port conformance suite. The opt-in integration test uses the real upstream package.

## License

House Anchor Adapter is AGPL-3.0-only. Anchor Memory is an external MIT-licensed project; see [NOTICE](NOTICE).
