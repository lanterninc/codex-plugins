import { describe, it, expect } from 'vitest';
import { PLUGINS, loadMcpConfig } from './repo.js';
import { McpConfigSchema } from './schemas.js';

describe('mcp config files', () => {
  for (const plugin of PLUGINS) {
    describe(`plugins/${plugin}/.mcp.json`, () => {
      it(`GIVEN the config WHEN parsed THEN it matches the McpConfigSchema`, () => {
        const raw = loadMcpConfig(plugin);
        const result = McpConfigSchema.safeParse(raw);
        expect(result.success, result.error?.message).toBe(true);
      });

      it(`GIVEN the config WHEN servers enumerated THEN exactly one server keyed 'lantern' exists`, () => {
        const parsed = McpConfigSchema.parse(loadMcpConfig(plugin));
        const keys = Object.keys(parsed.mcpServers);
        expect(keys).toEqual(['lantern']);
      });

      it(`GIVEN the lantern server url WHEN examined THEN it is an http(s) URL`, () => {
        const parsed = McpConfigSchema.parse(loadMcpConfig(plugin));
        expect(parsed.mcpServers.lantern.url).toMatch(/^https?:\/\//);
      });

      it(`GIVEN the lantern server url WHEN path examined THEN it ends with /agent/mcp`, () => {
        const parsed = McpConfigSchema.parse(loadMcpConfig(plugin));
        expect(parsed.mcpServers.lantern.url.endsWith('/agent/mcp')).toBe(true);
      });

      it(`GIVEN the lantern server WHEN Codex shape checked THEN it carries no Claude 'type' field`, () => {
        const raw = loadMcpConfig(plugin) as { mcpServers: { lantern: Record<string, unknown> } };
        expect('type' in raw.mcpServers.lantern).toBe(false);
      });
    });
  }

  it.runIf(PLUGINS.includes('lantern'))(
    'GIVEN the lantern plugin WHEN default host parsed THEN it is exactly agent.lantern.is',
    () => {
      const parsed = McpConfigSchema.parse(loadMcpConfig('lantern'));
      expect(new URL(parsed.mcpServers.lantern.url).host).toBe('agent.lantern.is');
    },
  );

  it('GIVEN a config with a non-URL url WHEN parsed THEN the schema rejects it', () => {
    const result = McpConfigSchema.safeParse({
      mcpServers: { lantern: { url: 'not-a-url' } },
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN a config missing the url field WHEN parsed THEN the schema rejects it', () => {
    const result = McpConfigSchema.safeParse({
      mcpServers: { lantern: { bearer_token_env_var: 'X' } },
    });
    expect(result.success).toBe(false);
  });
});
