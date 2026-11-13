---
name: brands
description: Use when the user wants to list the Lantern brands they can access or pick which brand to work with for this session, or asks "what brands can I see". This is the brand-bootstrap step every other Lantern skill depends on.
---

# Lantern brands

You have the Lantern MCP tools (`findings-interpreter.*`, plus `account-manager.get_brands` for brand lookup). This skill resolves *which* brand the rest of the session works with.

## What to do
Call `account-manager.get_brands` with `{}` unless a brand has already been resolved in this conversation. Match the user's name or domain to the returned brands; use the sole brand automatically, or ask the user to choose if ambiguous. If no brands are returned, explain the access limitation and stop. Remember the returned `id` internally as the selected brand ID; do not expose UUIDs unless requested. Use each tool's exact argument name below. Never send both `brand_id` and `accountBrandId`, and do not rely on a connection's implicit active brand.

The lookup returns a `brands` array with `{ id, name, slug, domains }` and account context. Present names and websites, using account context to disambiguate identical names.

## Passing the selected ID
- Use `brand_id` for website overview, visibility trends, citation tools, products, competitor comparison and recommendation mockups.
- Use `accountBrandId` for Overview attention, AI traffic, the action queue, action impact and action metadata.
- Brand lookup and portfolio overview are account-scoped: call them with `{}`.
- Action detail tools also need `actionId` set to the chosen queue entry’s `id`. A mockup needs `recommendation_id` from the metadata's `mockupRecommendationId`; these identifiers are not interchangeable.
Consult the relevant skill and the discovered input schema before calling a tool. Hosts may normalize tool punctuation; match the canonical operation, never guess an argument name.

## Presenting results
List the brand names plainly. Don't paste raw JSON or expose the UUIDs unless the user asks. Once a brand is chosen, hand off to whichever skill fits what they want next (visibility, citations, product quality, website readiness, competitors).
