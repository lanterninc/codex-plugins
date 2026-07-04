import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { parse as parseToml } from 'smol-toml';

// ---------------------------------------------------------------------------
// Static vocabulary constants
// ---------------------------------------------------------------------------

/**
 * The canonical set of tool names exposed by the Lantern MCP server.
 *
 * IMPORTANT: This list MUST be regenerated from the live MCP `tools/list`
 * response at `agent.lantern.is/agent/mcp` whenever tools are added or
 * removed. It is an internal-consistency mirror only — it ensures artifacts
 * (skills, agents) never reference non-existent tools, but it is NOT a
 * substitute for pulling the live server list.
 */
export const KNOWN_TOOLS: ReadonlyArray<string> = [
  'findings.get_brand_domains',
  'findings.get_visibility_brands',
  'findings.get_brand_scores',
  'findings.get_ai_readiness',
  'findings.get_readiness_summary',
  'findings.get_domain_analysis',
  'findings.get_analysis_history',
  'findings.get_analysis_diff',
  'findings.check_analysis_status',
  'findings.get_action_queue',
  'findings.get_products',
  'findings.get_product_catalog_summary',
  'findings.get_product_analysis',
  'findings.get_brand_citation_telemetry',
  'findings.explain_citation_telemetry',
  'findings.get_brand_competitor_citations',
  'findings.get_ai_traffic_data',
  'findings.get_action_impact',
  'findings.get_action_metadata',
  'findings.get_overview',
  'findings.get_overview_attention',
  'findings.get_portfolio_overview',
  'findings.get_brand_overview',
  'findings.compare_brands',
  'findings.get_mockup',
] as const;

/**
 * The set of plugins this repo ships, derived from marketplace.json so the
 * harness is repo-agnostic: the public repo declares one plugin name and the
 * private superset repo declares another, and the same tests validate either.
 */
export function listPlugins(): string[] {
  const mkt = loadMarketplace() as { plugins?: Array<{ name?: unknown }> };
  const names = (mkt.plugins ?? [])
    .map((p) => p.name)
    .filter((n): n is string => typeof n === 'string');
  return names;
}

/** Eager snapshot of listPlugins() for `for (const plugin of PLUGINS)` loops. */
export const PLUGINS: ReadonlyArray<string> = listPlugins();

export const CUSTOMER_SKILLS: ReadonlyArray<string> = [
  'ai-visibility',
  'citations',
  'product-quality',
  'website-analysis',
  'competitors',
  'brands',
] as const;

/**
 * Patterns that must NOT appear in any plugin content.
 * These represent write/mutating operations that violate the read-only contract.
 */
export const FORBIDDEN_TOOL_PATTERNS: ReadonlyArray<RegExp> = [
  /publish_/,
  /edit_website/,
  /apply_recommendation/,
  /draft_/,
  /ask_lantern/,
] as const;

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/** Absolute path to the repository root (the directory containing package.json). */
export function repoRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // src/repo.ts -> repo root is one level up from src/
  return resolve(dirname(thisFile), '..');
}

/** Read and JSON-parse a file at a path relative to the repo root. */
export function readJson(relPath: string): unknown {
  const abs = join(repoRoot(), relPath);
  const raw = readFileSync(abs, 'utf-8');
  return JSON.parse(raw) as unknown;
}

// ---------------------------------------------------------------------------
// Artifact loaders
// ---------------------------------------------------------------------------

/** Load and return the raw marketplace.json object (Codex: .agents/plugins/). */
export function loadMarketplace(): unknown {
  return readJson('.agents/plugins/marketplace.json');
}

/** Load plugin.json for a named plugin (Codex: .codex-plugin/plugin.json). */
export function loadPluginManifest(name: string): unknown {
  return readJson(`plugins/${name}/.codex-plugin/plugin.json`);
}

/** Load .mcp.json for a named plugin. */
export function loadMcpConfig(name: string): unknown {
  return readJson(`plugins/${name}/.mcp.json`);
}

/**
 * Return the list of skill directory names present for a plugin.
 * e.g. ['ai-visibility', 'citations', 'product-quality', 'website-analysis', 'competitors', 'brands']
 */
export function listSkillDirs(pluginName: string): string[] {
  const skillsDir = join(repoRoot(), 'plugins', pluginName, 'skills');
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir).filter((entry) =>
    statSync(join(skillsDir, entry)).isDirectory(),
  );
}

/**
 * Absolute path to the repo-root Codex subagent persona. Codex agents live in
 * `.codex/agents/*.toml` at the repo root — they are NOT a plugin-bundle
 * component, so there is exactly one analyst persona shared across the repo,
 * not one per plugin.
 */
export function agentPath(): string {
  return join(repoRoot(), '.codex', 'agents', 'lantern-analyst.toml');
}

/**
 * Parse gray-matter frontmatter from an absolute markdown path.
 * Returns `{ data, body }`.
 */
export function loadFrontmatter(absPath: string): { data: Record<string, unknown>; body: string } {
  const raw = readFileSync(absPath, 'utf-8');
  const parsed = matter(raw);
  const data: Record<string, unknown> = parsed.data;
  return { data, body: parsed.content };
}

/**
 * Parse a Codex agent TOML file into `{ data, body }` where `data` is the
 * parsed top-level table and `body` is the `developer_instructions` string
 * (the agent's persona prose — the closest analog to a markdown body).
 */
export function loadAgentToml(absPath: string): { data: Record<string, unknown>; body: string } {
  const raw = readFileSync(absPath, 'utf-8');
  const data = parseToml(raw) as Record<string, unknown>;
  const instr = data['developer_instructions'];
  const body = typeof instr === 'string' ? instr : '';
  return { data, body };
}

// ---------------------------------------------------------------------------
// Tool-surface partitioning
// ---------------------------------------------------------------------------

/**
 * The default tool surface. Skills that do not declare a `surface:` in their
 * frontmatter belong to this read-only `findings.*` surface, which the
 * read-only scans (no-write-tools, tool-integrity, skills) validate against
 * KNOWN_TOOLS. A skill that declares a DIFFERENT surface is a separate tool
 * family validated by its own gate and skipped by these scans.
 *
 * Keying on the literal 'findings' keeps this shared file token-clean.
 */
export const DEFAULT_SURFACE = 'findings';

/** The surface an artifact declares via frontmatter `surface:`; defaults to DEFAULT_SURFACE. */
export function artifactSurface(frontmatter: Record<string, unknown>): string {
  const s = frontmatter['surface'];
  return typeof s === 'string' && s.trim().length > 0 ? s.trim() : DEFAULT_SURFACE;
}

/** Skill dir names for a plugin that belong to the default (findings) surface. */
export function findingsSkillDirs(pluginName: string): string[] {
  return listSkillDirs(pluginName).filter((skill) => {
    const p = join(repoRoot(), 'plugins', pluginName, 'skills', skill, 'SKILL.md');
    if (!existsSync(p)) return false;
    return artifactSurface(loadFrontmatter(p).data) === DEFAULT_SURFACE;
  });
}

/**
 * Bare-suffix patterns that identify candidate tool references even when the
 * `findings.` namespace prefix is omitted.  Any token starting with one of
 * these verb prefixes followed by underscore-separated lowercase/digit
 * segments is treated as a bare tool reference and normalised to the full
 * `findings.<suffix>` form before validation.
 */
const BARE_TOOL_RE =
  /\b(get|compare|explain|check)_[a-z][a-z0-9_]*\b/g;

/**
 * Collect all `findings.<tool_name>` references from a text blob, including
 * bare shorthand forms such as `get_brand_scores` (without the `findings.`
 * prefix).  Returns a deduped array of the full dotted names.
 */
export function collectToolRefs(text: string): string[] {
  const result = new Set<string>();

  // 1. Prefixed form — end-anchored word boundary, lowercase only.
  const prefixedMatches = text.match(/\bfindings\.[a-z][a-z0-9_]*\b/g) ?? [];
  for (const m of prefixedMatches) {
    result.add(m);
  }

  // 2. Bare form — tokens shaped like known verb prefixes + underscore + segments.
  BARE_TOOL_RE.lastIndex = 0; // reset stateful global regex before use
  let bareMatch: RegExpExecArray | null;
  while ((bareMatch = BARE_TOOL_RE.exec(text)) !== null) {
    const token = bareMatch[0];
    result.add(`findings.${token}`);
  }

  return [...result];
}
