---
name: competitors
description: Use when the user wants to compare their brand against competitors on AI visibility or citations, or asks who they're losing/winning against in AI answers. Pulls live data from Lantern.
---

# Lantern competitors

You have Lantern MCP tools (`findings-interpreter.*`) for competitive comparison.

## Brand bootstrap (do this first)
Call `account-manager.get_brands` with `{}` unless a brand has already been resolved in this conversation. Match the user's name or domain to the returned brands; use the sole brand automatically, or ask the user to choose if ambiguous. If no brands are returned, explain the access limitation and stop. Remember the returned `id` internally as the selected brand ID; do not expose UUIDs unless requested. Use each tool's exact argument name below. Never send both `brand_id` and `accountBrandId`, and do not rely on a connection's implicit active brand.

## Which tool
- Cross-brand comparison (engine): `findings-interpreter.compare_brands` (`brand_id`: selected ID; optional `top_competitors` from 1 to 50, default 10).
- Which competitor pages AI cites: `findings-interpreter.get_citations` (`brand_id`: selected ID) marks each cited page as the brand's own, a competitor's, social media or an article.

## Presenting results
Lead with the head-to-head story ("Against Competitor X you're ahead on A, behind on B…"), then numbers. Name real competitors. No raw JSON. Null = "not available yet."

Comparison shares describe the returned tracked answers, not overall market share. Report the window provided by each tool; do not imply the competitor snapshot uses a requested visibility window unless its response confirms that.
