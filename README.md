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

## Install in the Codex app or IDE

Codex plugins are per-user and shared across the CLI, the desktop app, and the
IDE extension, so you register a marketplace once and it is available everywhere.

1. **Register this marketplace (CLI, once):**
   ```bash
   codex plugin marketplace add lanterninc/codex-plugins
   ```
   Added marketplaces are shared with the app and IDE.
2. **Desktop app:** open the **Plugins** panel, find **lantern** (browse or
   search), open its details, and select **Add to Codex** / the ➕ button.
3. **IDE extension (VS Code):** open the Codex Plugins view from the sidebar and
   enable **lantern**, or run the register command above in the extension's
   integrated terminal.
4. **Authenticate:** run `codex mcp login lantern` in a terminal once; the app
   and IDE reuse the stored credentials.

> Doc-derived, not verified against a live Codex app/IDE. Exact panel labels, and
> whether an added marketplace surfaces in the app's Plugins list, may differ by
> version — the CLI flow above is the reliable path.

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

## Build the ChatGPT portal package

From a clean checkout of this repository, with Python 3.11 or newer:

```bash
npm run export:chatgpt -- .
```

The command writes the plugin ZIP and SHA-256 checksum to `dist/chatgpt/`.
CI also attaches them as the `lantern-chatgpt-plugin` artifact. See
[`docs/chatgpt-plugin.md`](docs/chatgpt-plugin.md) for listing metadata,
source provenance, review cases, and submission preparation.
