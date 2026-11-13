# ChatGPT portal package

Build the ChatGPT plugin from a clean checkout of the **public**
[lanterninc/codex-plugins](https://github.com/lanterninc/codex-plugins) repository.
The command requires an explicit source checkout, verifies its Git origin and
clean status, and does not regenerate the source from the private plugin.

```bash
git clone https://github.com/lanterninc/codex-plugins.git /tmp/lantern-public
npm run export:chatgpt -- /tmp/lantern-public
```

Requires Python 3.11 or newer, Node.js, and `npm ci`. The builder also runs the MCP contract validator.
It produces `dist/chatgpt/lantern-chatgpt-<version>.zip` and its SHA-256 file.
`--output /path/to/output` changes the destination. Every ZIP contains one
`lantern/` directory, with no marketplace, repository harness, account bindings,
credentials, or lifecycle hooks. The build checks the completed archive's
inventory, integrity, and file contents before copying it to the destination.
Ignored local files are excluded even when they sit inside a skill directory.
CI retains the ZIP and checksum in the `lantern-chatgpt-plugin` artifact. In the
public repository, run `npm run export:chatgpt -- .` to package the checked-out
commit; its CI does the same. The source repository's integration CI validates the generated public tree and
builds a ZIP from that exact tree, so packaging inputs cannot silently lag the source.

Version 0.1.1 corrects the canonical tool namespace and per-tool inputs.
`SOURCE.json` records the exact clean Git commit and packaged skill hashes.
Six customer skills and the read-only analyst workflow are included. The
existing identity, starter prompts, icon and OAuth read scopes are preserved.

## Listing and configuration

`export/chatgpt/metadata.json` supplies the listing, review cases, and publication
metadata. Unknown values should be omitted rather than populated with
placeholders. Update that file and rebuild to change ZIP-managed portal fields.

- Publisher: Listenmore Technologies Inc. DBA Lantern, as supplied by the owner.
- Availability: United States (`US`).
- Subtitle: “Understand your AI visibility” (29 characters).
- Category: Data & Analytics.
- Commerce: the plugin does not process payments; Lantern platform payments
  happen separately.
- Website, contact, privacy, and terms URLs were opened and inspected. The owner
  confirmed that the policies cover this integration. Publisher verification in
  the portal remains separate from the package's publisher name.
- Icon: the existing `https://lantern.is/icon.svg`, rendered unchanged at 512 ×
  512 pixels. The original SVG and resulting PNG are retained in
  `export/chatgpt/assets/`. Only the PNG is included in the ZIP.

The root `plugin.json` and `mcp.json` use the Agent Plugins 1.0 schemas. The MCP
server is the public repository's `https://agent.lantern.is/agent/mcp`, with
Streamable HTTP and OAuth dynamic client registration. An unauthenticated
initialize request returned the expected HTTP 401 and a protected-resource
metadata URL. That metadata and the authorization-server discovery document
advertise the production resource, registration endpoint, PKCE, and the
`read:findings` and `read:rankings` scopes. Only those read scopes are requested.
Endpoints are discovered rather than duplicated as overrides in the package.

## Contract validation and live review

The November 13 input snapshot was read from the portal's last available tool
definitions and cross-checked with https://lantern.is/docs/mcp. The rescan
reported that authorization was missing or no longer usable. Consequently,
this snapshot is **not proof of a fresh authenticated scan or live calls**.

`npm run check:mcp-contracts` validates all authored tool names and 19 synthetic
example calls with Ajv against the saved input schemas. The export runs this
gate too. Before every submission, capture fresh authenticated `tools/list`
JSON (no token or credentials), then validate and package against that file:

```bash
npm run check:mcp-contracts -- --snapshot /path/to/tools-list.json
npm run export:chatgpt -- . --tool-snapshot /path/to/tools-list.json
```

Regressions cover the former `accountBrandId`/`brand_id` mismatch, a removed
operation, and mutually exclusive product identifiers. The saved schema file
is a local regression baseline; it does not detect remote changes until refreshed.

The five positive cases now bootstrap their own brand selection in a fresh
conversation. Each populated-data case specifies its fixture prerequisites.
Missing fixture data means **Blocked**, not a passing populated-data test.
The three negative cases expect no tool call for unsupported actions. Current
case status: **Not run on ChatGPT web or mobile**. Schema validation and a
simulated instruction walkthrough must never be reported as end-to-end passes.

Positive coverage: accessible brand selection; a combined visibility and
competitor report; citation trends by AI assistant; a product summary followed
by product detail; and latest website readiness with one recommendation.
Negative coverage: applying or publishing changes; unavailable per-product
quality grades; and starting an analysis with a historical run comparison.

Before recording, use a dedicated test account with sample data: at least one
accessible brand, completed tracking, competitor citations, products, a site
analysis, and a queued recommendation. Do not record a real customer's private
data. Reviewer credentials belong only in the secure portal fields, never in
this repository, the ZIP, or the public demo.

Record this walkthrough in ChatGPT using a development connection to the same
production MCP endpoint and the packaged skills:

1. Start screen recording after sign-in; keep credentials and OAuth tokens off
   screen. Show the Lantern plugin and version being tested.
2. Ask **List my Lantern brands** and select the sample brand. Show that only
   accessible brands are returned.
3. Ask **Give me a visibility overview for this brand and compare it with its
   competitors.** Show the tool-backed figures and actual data window.
4. Ask **Which sources cited this brand over the last 30 days, and how did
   citations change for each AI assistant?** Show named sources and channel
   distinctions.
5. Ask **Which of this brand's products appear in AI shopping answers? Show
   details for one of them.** Show a real returned product and its detail.
6. Ask **Show this brand's latest website readiness findings and explain one
   recommended fix waiting for review.** Show the latest status and estimated
   impact without making a change.
7. Run each of the three negative prompts in `metadata.json`. Show the specific
   limitation, safe fallback, and absence of mutation calls or fabricated data.
8. Stop recording, replay it, and check that prompts and results are legible and
   no credentials or unrelated private data appear. Host it at a URL reviewers
   can play without requesting access.

Computer use can help operate this walkthrough while the owner records it.
Screenshots are not a demo video. A real recording still needs to be made and
verified; this guide is not recorded evidence.

Keep reviewer credentials in the secure portal fields. A demo URL already saved
in the portal is preserved when `review.demo_recording_url` is omitted from the
replacement ZIP; only include it in source if it is intentionally public. Record each case's actual
result as Passed, Failed, Blocked, or Not run in private preparation notes; do
not add unsupported result fields to the manifest.

## Portal submission procedure

Upload the full replacement ZIP to the existing Lantern plugin, preserving
its identity and saved reviewer/demo fields. Inspect the imported five positive
and three negative cases. Reconnect the existing read-scoped MCP account and
complete a fresh scan after any server schema change.

Run all eight exact prompts on ChatGPT web, iOS and Android using the same
review account and fixture. For each run retain platform/version, package Git
commit, actual tool names and input/output evidence, date window, and result
(Passed, Failed, Blocked or Not run). Repeat the populated-data cases to check
consistency; recheck the pending-action fixture immediately before review.
Verify the demo and reviewer login against this version. Do not submit while
any required run is failed, blocked or untested. The owner completes legal
attestations. Submission and later publication are separate actions.

References: [Lantern MCP documentation](https://lantern.is/docs/mcp),
[App review](https://developers.openai.com/plugins/deploy/app-review), and
[Submission](https://developers.openai.com/plugins/deploy/submission).
