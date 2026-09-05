# Compatibility

| Adapter | House Runtime | House Toolkit | Anchor upstream | Status |
| --- | --- | --- | --- | --- |
| `v0.1.0-rc.1` | exact `v0.3.0-rc.1` | exact `v0.3.0-rc.1` | commit `557e073b2647c3cc0a7d4451fc24d83c09668cb6` locally verified | Release candidate |

Anchor is loaded from an explicit local path. The adapter does not download or update it automatically. A newer upstream commit requires the opt-in real integration test before this compatibility row changes.

## September 2026 maintenance

Package `0.1.0-rc.2` follows `0.1.0-rc.1` with unchanged document profiles and storage semantics. Its exact dependency tags are `house-runtime#v0.3.0-rc.3`, `house-toolkit#v0.3.0-rc.4`. Use the committed root lockfile; downstream projects must update their own locks. See [CHANGELOG.md](CHANGELOG.md).
