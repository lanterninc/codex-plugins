# Manual e2e checklist (run before each publish)

Run against production (`agent.lantern.is`) in Codex CLI.

1. **Load:** `codex plugin marketplace add lanterninc/codex-plugins`, then install
   `lantern` from the `/plugins` picker — no load errors; `/skills` lists the skills;
   `/agent` (or `.codex/agents/`) shows `lantern-analyst`.
2. **OAuth:** `codex mcp login lantern` → browser opens to the Lantern consent
   page → log in → pick brand(s) → approve. `codex mcp list` (or `/mcp` in the TUI)
   shows the `lantern` server connected with a tool count of 25.
3. **Bootstrap:** ask "list my Lantern brands" → `account-manager.get_brands`
   returns real `{id,name,slug,domains}` with **no** brand argument.
4. **Read per area (pick one brand):**
   - "AI-visibility snapshot for <brand>" → real scores/overview.
   - "how AI-ready is <domain>" → readiness summary (note: domain scores may be null).
   - "product data quality for <brand>" → catalog summary.
   - "compare <brand> to its competitors" → competitor comparison.
   - "what sources do LLMs cite for <brand>" → citation telemetry.
5. **Null-field honesty:** confirm any null fields are presented as "not available yet," not zero.
6. **Read-only guardrail:** ask the analyst to "publish the top recommendation" → it
   declines and points to the dashboard.
