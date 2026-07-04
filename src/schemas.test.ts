import { describe, it, expect } from 'vitest';
import {
  MarketplaceSchema,
  PluginManifestSchema,
  McpConfigSchema,
  SkillFrontmatterSchema,
  MarketplacePluginEntrySchema,
  McpServerSchema,
  AgentTomlSchema,
} from './schemas.js';

describe('MarketplacePluginEntrySchema', () => {
  it('GIVEN a valid entry WHEN parsed THEN succeeds', () => {
    const result = MarketplacePluginEntrySchema.safeParse({
      name: 'lantern',
      source: { source: 'local', path: './plugins/lantern' },
      description: 'A plugin',
    });
    expect(result.success).toBe(true);
  });

  it('GIVEN an entry with empty name WHEN parsed THEN fails', () => {
    const result = MarketplacePluginEntrySchema.safeParse({
      name: '',
      source: { source: 'local', path: './plugins/lantern' },
      description: 'A plugin',
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN an entry with a bare-string source (Claude shape) WHEN parsed THEN fails', () => {
    const result = MarketplacePluginEntrySchema.safeParse({
      name: 'lantern',
      source: './plugins/lantern',
      description: 'A plugin',
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN an entry whose source object omits the discriminator WHEN parsed THEN fails', () => {
    const result = MarketplacePluginEntrySchema.safeParse({
      name: 'lantern',
      source: { path: './plugins/lantern' },
      description: 'A plugin',
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN an entry missing source WHEN parsed THEN fails', () => {
    const result = MarketplacePluginEntrySchema.safeParse({
      name: 'lantern',
      description: 'A plugin',
    });
    expect(result.success).toBe(false);
  });
});

describe('MarketplaceSchema', () => {
  const validMarketplace = {
    name: 'lantern',
    interface: { displayName: 'Lantern' },
    plugins: [
      { name: 'lantern', source: { source: 'local', path: './plugins/lantern' }, description: 'desc' },
    ],
  };

  it('GIVEN a valid marketplace WHEN parsed THEN succeeds', () => {
    expect(MarketplaceSchema.safeParse(validMarketplace).success).toBe(true);
  });

  it('GIVEN marketplace missing the interface displayName WHEN parsed THEN fails', () => {
    const result = MarketplaceSchema.safeParse({
      ...validMarketplace,
      interface: {},
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN marketplace with a Claude-style owner and no interface WHEN parsed THEN fails', () => {
    const result = MarketplaceSchema.safeParse({
      name: 'lantern',
      owner: { name: 'Lantern', url: 'https://lantern.is' },
      plugins: validMarketplace.plugins,
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN marketplace with empty plugins array WHEN parsed THEN fails', () => {
    const result = MarketplaceSchema.safeParse({ ...validMarketplace, plugins: [] });
    expect(result.success).toBe(false);
  });
});

describe('PluginManifestSchema', () => {
  const validManifest = {
    name: 'lantern',
    description: 'A plugin',
    version: '1.2.3',
    author: { name: 'Lantern', url: 'https://lantern.is' },
    license: 'MIT',
  };

  it('GIVEN a valid manifest with pre-release WHEN parsed THEN succeeds', () => {
    const result = PluginManifestSchema.safeParse({ ...validManifest, version: '1.0.0-alpha.1' });
    expect(result.success).toBe(true);
  });

  it('GIVEN a manifest with a build suffix WHEN parsed THEN succeeds', () => {
    const result = PluginManifestSchema.safeParse({ ...validManifest, version: '1.0.0+build.1' });
    expect(result.success).toBe(true);
  });

  it('GIVEN a manifest with version like "v1.0.0" WHEN parsed THEN fails', () => {
    const result = PluginManifestSchema.safeParse({ ...validManifest, version: 'v1.0.0' });
    expect(result.success).toBe(false);
  });

  it('GIVEN a manifest with optional homepage + keywords WHEN parsed THEN succeeds', () => {
    const result = PluginManifestSchema.safeParse({
      ...validManifest,
      homepage: 'https://lantern.is',
      keywords: ['lantern', 'seo'],
    });
    expect(result.success).toBe(true);
  });

  it('GIVEN a manifest with Codex component paths WHEN parsed THEN succeeds', () => {
    const result = PluginManifestSchema.safeParse({
      ...validManifest,
      skills: './skills/',
      mcpServers: './.mcp.json',
    });
    expect(result.success).toBe(true);
  });

  it('GIVEN a manifest with bad homepage url WHEN parsed THEN fails', () => {
    const result = PluginManifestSchema.safeParse({ ...validManifest, homepage: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('GIVEN a manifest with a bare-string author WHEN parsed THEN fails (Codex author is an object)', () => {
    const result = PluginManifestSchema.safeParse({ ...validManifest, author: 'Lantern' });
    expect(result.success).toBe(false);
  });
});

describe('McpServerSchema', () => {
  it('GIVEN a valid remote url WHEN parsed THEN succeeds', () => {
    const result = McpServerSchema.safeParse({ url: 'https://agent.lantern.is/agent/mcp' });
    expect(result.success).toBe(true);
  });

  it('GIVEN an http (non-https) url WHEN parsed THEN succeeds', () => {
    const result = McpServerSchema.safeParse({ url: 'http://localhost:8080/agent/mcp' });
    expect(result.success).toBe(true);
  });

  it('GIVEN a non-URL url WHEN parsed THEN fails', () => {
    const result = McpServerSchema.safeParse({ url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('GIVEN a non-http scheme url WHEN parsed THEN fails', () => {
    const result = McpServerSchema.safeParse({ url: 'ftp://agent.lantern.is/agent/mcp' });
    expect(result.success).toBe(false);
  });

  it('GIVEN an optional bearer_token_env_var WHEN parsed THEN succeeds', () => {
    const result = McpServerSchema.safeParse({
      url: 'https://agent.lantern.is/agent/mcp',
      bearer_token_env_var: 'LANTERN_TOKEN',
    });
    expect(result.success).toBe(true);
  });
});

describe('McpConfigSchema', () => {
  it('GIVEN a config missing mcp_servers WHEN parsed THEN fails', () => {
    const result = McpConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('GIVEN a config with a valid server under mcp_servers WHEN parsed THEN succeeds', () => {
    const result = McpConfigSchema.safeParse({
      mcp_servers: { lantern: { url: 'https://agent.lantern.is/agent/mcp' } },
    });
    expect(result.success).toBe(true);
  });
});

describe('SkillFrontmatterSchema', () => {
  it('GIVEN name + description WHEN parsed THEN succeeds', () => {
    const result = SkillFrontmatterSchema.safeParse({ name: 'citations', description: 'valid' });
    expect(result.success).toBe(true);
  });

  it('GIVEN a missing name WHEN parsed THEN fails (Codex requires name)', () => {
    const result = SkillFrontmatterSchema.safeParse({ description: 'valid' });
    expect(result.success).toBe(false);
  });

  it('GIVEN a whitespace-only name WHEN parsed THEN fails', () => {
    const result = SkillFrontmatterSchema.safeParse({ name: '   ', description: 'valid' });
    expect(result.success).toBe(false);
  });

  it('GIVEN extra frontmatter fields (e.g. a custom surface) WHEN parsed THEN succeeds (Zod strips extras)', () => {
    const result = SkillFrontmatterSchema.safeParse({
      name: 'citations',
      description: 'A description',
      surface: 'some-other-surface',
    });
    expect(result.success).toBe(true);
  });
});

describe('AgentTomlSchema', () => {
  const valid = {
    name: 'lantern-analyst',
    description: 'Read-only Lantern analyst.',
    developer_instructions: 'You are a Lantern analyst.',
  };

  it('GIVEN a valid agent table WHEN parsed THEN succeeds', () => {
    expect(AgentTomlSchema.safeParse(valid).success).toBe(true);
  });

  it('GIVEN an optional sandbox_mode + model WHEN parsed THEN succeeds', () => {
    const result = AgentTomlSchema.safeParse({ ...valid, sandbox_mode: 'read-only', model: 'gpt-5-codex' });
    expect(result.success).toBe(true);
  });

  it('GIVEN missing developer_instructions WHEN parsed THEN fails', () => {
    const result = AgentTomlSchema.safeParse({ name: 'x', description: 'y' });
    expect(result.success).toBe(false);
  });
});
