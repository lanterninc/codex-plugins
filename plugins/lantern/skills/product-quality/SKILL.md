---
name: product-quality
description: Use when the user asks how their products show up in AI shopping answers, which products AI recommends or links to their store, how one product is doing, or about product data quality. Pulls live data from Lantern.
---

# Lantern products

You have Lantern MCP tools (`findings-interpreter.*`) for the Products page: how the brand's products appear in AI shopping answers.

## Unsupported requests
For a request only for unavailable product-quality scores or grades, explain the limitation without any tool call, including brand lookup. Offer appearances as a follow-up; retrieve them only if the user requests that alternative.

## Brand bootstrap (for supported reads)
Call `account-manager.get_brands` with `{}` unless a brand has already been resolved in this conversation. Match the user's name or domain to the returned brands; use the sole brand automatically, or ask the user to choose if ambiguous. If no brands are returned, explain the access limitation and stop. Remember the returned `id` internally as the selected brand ID; do not expose UUIDs unless requested. Use each tool's exact argument name below. Never send both `brand_id` and `accountBrandId`, and do not rely on a connection's implicit active brand.

## Which tool
Pass `brand_id` explicitly and keep `days` consistent across summary, list and detail.

- The Products page summary: `findings-interpreter.get_product_catalog_summary` (brand, `days` 7, 30 or 90, default 30). It covers how many of the brand's products AI recommended, how many tracked prompts named them, the share of their links that went to the brand's own site, the AI engines, competitors' products and the stores shoppers were sent to.
- The Products page list: `findings-interpreter.get_products`. For products appearing in AI answers, send `filter: "recommended"`. The default `all` can include catalog products never recommended. With unmatched catalogs the tool may return observed product appearances instead; follow the response. Each product has a `product_id` or `product_key`.
- One product's detail: `findings-interpreter.get_product_detail` (`brand_id` plus exactly one `product_id` or `product_key` returned by `findings-interpreter.get_products`; never send both). If no product is returned, explain that and do not invent a detail identifier.

## Product data quality
Per-product data-quality scores and grades are no longer available over MCP. Say so plainly and do not estimate them; offer how the products appear in AI answers instead.

## Presenting results
Lead with the story ("AI recommends three of your products, and most links go to retailers rather than your store…"), then numbers. No raw JSON. A window with no finished prompt run is not measured: say so, never report it as zero.
