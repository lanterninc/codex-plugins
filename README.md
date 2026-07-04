# Lantern Codex plugin

Read-only Lantern data in Codex CLI: AI-visibility, citations, product data
quality, and website AI-readiness. Pick a brand and ask.

## Install
```bash
codex plugin marketplace add lanterninc/codex-plugins
codex plugin install lantern            # or /plugins inside the TUI
codex mcp login lantern                 # authenticate to Lantern
```

## Local development / testing
Point Codex at `./plugins/lantern` (see the Codex plugin docs for local
marketplace / `--plugin-dir` usage), then `codex mcp login lantern`.

### Manual e2e checklist (run before each publish)
See `docs/e2e-checklist.md`.
