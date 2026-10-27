# ChatGPT portal package

Build the ChatGPT plugin from a clean checkout of the **public**
[lanterninc/codex-plugins](https://github.com/lanterninc/codex-plugins) repository.
The command requires an explicit source checkout, verifies its Git origin and
clean status, and does not regenerate the source from the private plugin.

```bash
git clone https://github.com/lanterninc/codex-plugins.git /tmp/lantern-public
npm run export:chatgpt -- /tmp/lantern-public
```

Requires Python 3.11 or newer. The build uses only the Python standard library.
It produces `dist/chatgpt/lantern-chatgpt-<version>.zip` and its SHA-256 file.
`--output /path/to/output` changes the destination. Every ZIP contains one
`lantern/` directory, with no marketplace, repository harness, account bindings,
credentials, or lifecycle hooks. The build checks the completed archive's
inventory, integrity, and file contents before copying it to the destination.
Ignored local files are excluded even when they sit inside a skill directory.
CI retains the ZIP and checksum in the `lantern-chatgpt-plugin` artifact. In the
public repository, run `npm run export:chatgpt -- .` to package the checked-out
commit; its CI does the same. The source repository's integration CI uses a
pinned public commit, which should be updated deliberately for newer releases.

The artifact prepared on October 27, 2026 uses public commit
`c50ff77896af09e84b82e59f504ed3bba9b32b25`. Its six source skills are byte-identical;
`SOURCE.json` records their hashes and the exact source commit. The seventh
skill adapts the public repository's `lantern-analyst` Codex persona into a
portable skill, preserving its read-only instructions. Its default prompts and
brand color are retained from the source manifest. The public source checkout
remains unchanged.

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

Discovery was checked without signing in. OAuth completion, the tools returned
for the resulting read-scoped token, and their `readOnlyHint`, `openWorldHint`,
and `destructiveHint` annotations still need verification with a reviewer/test
account. This package does not deploy or change the Lantern MCP server.

## Review cases and demo

The manifest contains five positive and three negative cases with prompts,
setup, tool expectations, and pass conditions. They are **Not run** against the
packaged plugin. Source tool references use `findings.*`; some hosts expose the
same operations under a `findings-interpreter` namespace with normalized names.
Check the actual discovered names and schemas when running the cases, and
update the review expectations if the portal requires the exact exposed names.

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

Add the verified recording URL to `review.demo_recording_url` in
`export/chatgpt/metadata.json`, then rebuild the ZIP. Record each case's actual
result as Passed, Failed, Blocked, or Not run in private preparation notes; do
not add unsupported result fields to the manifest.

## Portal handoff

The ZIP is structurally validated and prepared for draft upload. It is **not yet
ready for public review**: the demo, dedicated reviewer access, live cases and
tool annotations, and portal verification remain incomplete. Nothing has been
uploaded, submitted, or published by the packaging command.

Once review materials are prepared, upload the ZIP at
[OpenAI Plugins](https://platform.openai.com/plugins) under the intended verified
publisher. Inspect imported listing and US availability; complete MCP domain
verification, OAuth connection and required scans; enter reviewer access in
the secure form; and run the cases against that exact saved version. The owner
must complete required attestations. Draft upload, submission for review, and
publication are separate steps.

References checked October 27, 2026:
[Package your plugin](https://developers.openai.com/plugins/build/plugins) and
[Upload and submit your plugin](https://developers.openai.com/plugins/deploy/submission).
