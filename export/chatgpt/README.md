# Lantern

Connect your Lantern account to read AI visibility, citations, competitor
comparisons, product appearances in AI shopping answers, AI referral traffic,
and the latest website readiness findings in ChatGPT or Codex.

Start with **List my Lantern brands**, choose a brand, then ask a question.
For a combined report, ask for a visibility, citations, and competitor readout.
The plugin reads existing findings. Changes and new analyses happen in the
Lantern dashboard.

The six domain skills are copied from
[lanterninc/codex-plugins](https://github.com/lanterninc/codex-plugins).
The `lantern-analyst` skill adapts that repository's Codex agent instructions
for hosts that load portable skills. `SOURCE.json` records the source commit
and hashes of the original skills.

The MCP connection uses `https://agent.lantern.is/agent/mcp` with OAuth dynamic
client registration and the `read:findings` and `read:rankings` scopes.
Complete authentication in the host's connection flow. No credentials are
included in this package. A Lantern account with access to the relevant brand
and data is required.

[Website](https://lantern.is) · [Support](https://lantern.is/contact) ·
[Privacy](https://lantern.is/privacy) · [Terms](https://lantern.is/terms)
