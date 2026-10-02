---
name: brands
description: Use when the user wants to list the Lantern brands they can access or pick which brand to work with for this session, or asks "what brands can I see". This is the brand-bootstrap step every other Lantern skill depends on.
---

# Lantern brands

You have the Lantern MCP tools (`findings.*`, plus `account-manager.get_brands` for brand lookup). This skill resolves *which* brand the rest of the session works with.

## What to do
Call `account-manager.get_brands` (no arguments). It returns the brands the current token can reach as `{ id, name, slug, domains }`. Present them by name, with their websites (note the UUID is only used internally). Ask which brand the user wants to work with, and remember that `accountBrandId` — thread it into every later Lantern request this session.

If only one brand comes back, use it and say so. If the user already named a brand, match it and skip the question.

## Presenting results
List the brand names plainly. Don't paste raw JSON or expose the UUIDs unless the user asks. Once a brand is chosen, hand off to whichever skill fits what they want next (visibility, citations, product quality, website readiness, competitors).
