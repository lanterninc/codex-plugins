import { z } from 'zod';

// ---------------------------------------------------------------------------
// Marketplace schema (Codex: .agents/plugins/marketplace.json)
// ---------------------------------------------------------------------------

/** A marketplace plugin entry. Codex points `source` at a plugin dir via `{ path }`. */
export const MarketplacePluginEntrySchema = z.object({
  name: z.string().min(1),
  source: z.object({ path: z.string().min(1) }),
  description: z.string().min(1),
});

export const MarketplaceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  owner: z.object({
    name: z.string().min(1),
    url: z.string().url(),
  }),
  plugins: z.array(MarketplacePluginEntrySchema).min(1),
});

export type Marketplace = z.infer<typeof MarketplaceSchema>;

// ---------------------------------------------------------------------------
// Plugin manifest schema (Codex: .codex-plugin/plugin.json)
// ---------------------------------------------------------------------------

/** Loose semver — three numeric segments, optional pre-release/build. */
const SEMVER_RE = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;

export const PluginManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(SEMVER_RE, 'version must be a semver string (e.g. 1.2.3)'),
  description: z.string().min(1),
  // Codex uses a plain string author (unlike Claude Code's { name, url } object).
  author: z.string().min(1),
  license: z.string().min(1),
  homepage: z.string().url().optional(),
  repository: z.string().optional(),
  keywords: z.array(z.string().min(1)).optional(),
  // Codex component path keys — `./`-relative, kept inside the plugin root.
  skills: z.string().min(1).optional(),
  mcpServers: z.string().min(1).optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

// ---------------------------------------------------------------------------
// MCP config schema (Codex: presence of `url` ⇒ streamable-HTTP transport)
// ---------------------------------------------------------------------------

export const McpServerSchema = z.object({
  // A concrete remote MCP URL. Codex infers streamable-HTTP from the `url` key;
  // there is no `type` field. OAuth is handled out-of-band via `codex mcp login`.
  url: z.string().url().refine((u) => /^https?:\/\//.test(u), {
    message: 'url must be an http(s) URL',
  }),
  // Optional static bearer token sourced from an env var (skip when using OAuth).
  bearer_token_env_var: z.string().min(1).optional(),
});

export const McpConfigSchema = z.object({
  mcpServers: z.object({
    lantern: McpServerSchema,
  }),
});

export type McpConfig = z.infer<typeof McpConfigSchema>;

// ---------------------------------------------------------------------------
// Skill frontmatter schema (Codex requires name + description)
// ---------------------------------------------------------------------------

export const SkillFrontmatterSchema = z.object({
  name: z
    .string()
    .min(1, 'name must be a non-empty string')
    .refine((s) => s.trim().length > 0, { message: 'name must not be whitespace-only' }),
  description: z
    .string()
    .min(1, 'description must be a non-empty string')
    .refine((s) => s.trim().length > 0, {
      message: 'description must not be whitespace-only',
    }),
});

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Agent TOML schema (Codex: .codex/agents/*.toml)
// ---------------------------------------------------------------------------

export const AgentTomlSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  developer_instructions: z.string().min(1),
  sandbox_mode: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
});

export type AgentToml = z.infer<typeof AgentTomlSchema>;
