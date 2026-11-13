---
name: website-analysis
description: Use when the user asks how AI-ready a website/domain is, wants the latest website AI-readiness analysis, checks whether an analysis has finished, or asks what recommended actions exist to improve. Pulls live data from Lantern.
---

# Lantern website AI-readiness

You have Lantern MCP tools (`findings-interpreter.*`, plus `account-manager.get_brands` for brand lookup) for website analysis and the recommendation queue.

## Unsupported requests
For a request only to start an analysis, apply or publish fixes, or compare an unsupported six-month historical run, explain the limitation without any tool call, including brand lookup. Offer the supported read-only alternative; do not fetch a substitute unless the user requests it.

## Brand bootstrap (for supported reads)
Call `account-manager.get_brands` with `{}` unless a brand has already been resolved in this conversation. Match the user's name or domain to the returned brands; use the sole brand automatically, or ask the user to choose if ambiguous. If no brands are returned, explain the access limitation and stop. Remember the returned `id` internally as the selected brand ID; do not expose UUIDs unless requested. Use each tool's exact argument name below. Never send both `brand_id` and `accountBrandId`, and do not rely on a connection's implicit active brand.

## Which tool
- Readiness picture, latest scores, top recommendations and analysis status: `findings-interpreter.get_brand_overview` (`brand_id`: selected ID; `detail: "summary"` answers most questions).
- Is an analysis finished or still running: the `findings-interpreter.get_brand_overview` status.
- Fixes waiting for review: `findings-interpreter.get_action_queue` with `accountBrandId`, then `findings-interpreter.get_action_impact` and `findings-interpreter.get_action_metadata` with the same `accountBrandId` and `actionId` set to the chosen queue entry’s `id`. The queue contains at most 10 newest pending actions; do not call its count the full backlog. If empty, say there is no returned pending action and skip detail calls.
- Before/after visuals for a recommendation: `findings-interpreter.get_mockup` with `brand_id` and `recommendation_id` from `mockupRecommendationId` in action metadata. If that field is absent, do not guess a recommendation ID. A mockup-only request needs queue, metadata and mockup; skip impact unless requested.

## Important
This is read-only. You can show the latest analysis, the recommendation queue and an action's estimated impact, but you cannot start an analysis, apply, publish, or edit anything: those happen in the Lantern dashboard. For available score history, `findings-interpreter.get_brand_overview` accepts `detail: "with_history"` (last 12 weeks). This does not promise arbitrary historical runs or a six-month run-to-run comparison. Explain that limit and offer the available history; never fabricate a past snapshot.

## Presenting results
Lead with what's strong/weak and the highest-impact next steps, then numbers. Describe recommendations by title and explanation, not score or rank. No raw JSON. If a field comes back null, say it's "not available yet," not zero.
