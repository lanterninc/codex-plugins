# Lantern Codex plugin

Read-only Lantern data in Codex CLI: AI-visibility, citations, product data
quality, and website AI-readiness. Pick a brand and ask.

## Install

1. Add the marketplace:
   ```bash
   codex plugin marketplace add lanterninc/codex-plugins
   ```
2. Start Codex and install the plugin from the picker:
   ```bash
   codex          # then, in the TUI, run:  /plugins  → select lantern → Install
   ```
3. Authenticate to Lantern:
   ```bash
   codex mcp login lantern
   ```
   Confirm with `codex mcp list` (or `/mcp` in the TUI).

> Codex CLI plugin management is young; exact subcommands may differ by version.
> If the commands above behave differently, check `codex --help` /
> `codex plugin --help`.

## What you can ask

Pick a brand first ("list my Lantern brands"), then ask:

- **AI visibility** — "how visible is <brand> across AI assistants?"
- **Website AI-readiness** — "how AI-ready is <domain>?"
- **Product data quality** — "how complete is <brand>'s product catalog?"
- **Competitors** — "compare <brand> to its competitors"
- **Citations** — "what sources do LLMs cite for <brand>?"
- **`lantern-analyst` agent** — one narrative readout across several of the above.

All tools are strictly read-only — act on recommendations in the Lantern dashboard.

### Manual e2e checklist (run before each publish)
See `docs/e2e-checklist.md`.
