import { describe, it, expect } from 'vitest';
import { PLUGINS, loadPluginManifest } from './repo.js';
import { PluginManifestSchema } from './schemas.js';

describe('plugin manifests', () => {
  for (const plugin of PLUGINS) {
    describe(`plugins/${plugin}/.codex-plugin/plugin.json`, () => {
      it(`GIVEN the manifest WHEN parsed THEN it matches the PluginManifestSchema`, () => {
        const raw = loadPluginManifest(plugin);
        const result = PluginManifestSchema.safeParse(raw);
        expect(result.success, result.error?.message).toBe(true);
      });

      it(`GIVEN the manifest WHEN name read THEN it matches the directory name`, () => {
        const parsed = PluginManifestSchema.parse(loadPluginManifest(plugin));
        expect(parsed.name).toBe(plugin);
      });

      it(`GIVEN the manifest WHEN version read THEN it matches semver pattern`, () => {
        const parsed = PluginManifestSchema.parse(loadPluginManifest(plugin));
        expect(parsed.version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/);
      });

      it(`GIVEN the manifest WHEN license read THEN it is MIT`, () => {
        const parsed = PluginManifestSchema.parse(loadPluginManifest(plugin));
        expect(parsed.license).toBe('MIT');
      });

      it(`GIVEN the manifest WHEN author and description checked THEN both are non-empty`, () => {
        const parsed = PluginManifestSchema.parse(loadPluginManifest(plugin));
        expect(parsed.description.length).toBeGreaterThan(0);
        expect(parsed.author.name.length).toBeGreaterThan(0);
      });

      it(`GIVEN the manifest WHEN Codex component paths checked THEN skills and mcpServers point at bundle files`, () => {
        const parsed = PluginManifestSchema.parse(loadPluginManifest(plugin));
        expect(parsed.skills).toBe('./skills/');
        expect(parsed.mcpServers).toBe('./.mcp.json');
      });

      it(`GIVEN the manifest WHEN interface metadata checked THEN required Codex UI fields are present`, () => {
        const parsed = PluginManifestSchema.parse(loadPluginManifest(plugin));
        expect(parsed.interface.displayName.length).toBeGreaterThan(0);
        expect(parsed.interface.shortDescription.length).toBeGreaterThan(0);
        expect(parsed.interface.longDescription.length).toBeGreaterThan(0);
        expect(parsed.interface.developerName).toBe('Lantern');
        expect(parsed.interface.category.length).toBeGreaterThan(0);
        expect(parsed.interface.capabilities.length).toBeGreaterThan(0);
        expect(parsed.interface.defaultPrompt?.length ?? parsed.interface.default_prompt?.length ?? 0).toBeGreaterThan(0);
      });
    });
  }

  const objAuthor = { name: 'X', url: 'https://x.com' };
  const objInterface = {
    displayName: 'Test',
    shortDescription: 'Short',
    longDescription: 'Long',
    developerName: 'Lantern',
    category: 'Productivity',
    capabilities: ['Read'],
    defaultPrompt: ['Start'],
  };

  it('GIVEN a manifest with a bad version WHEN parsed THEN the schema rejects it', () => {
    const result = PluginManifestSchema.safeParse({
      name: 'test',
      description: 'test',
      version: 'not-semver',
      author: objAuthor,
      license: 'MIT',
      interface: objInterface,
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN a manifest missing license WHEN parsed THEN the schema rejects it', () => {
    const result = PluginManifestSchema.safeParse({
      name: 'test',
      description: 'test',
      version: '1.0.0',
      author: objAuthor,
      interface: objInterface,
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN a manifest with an empty description WHEN parsed THEN the schema rejects it', () => {
    const result = PluginManifestSchema.safeParse({
      name: 'test',
      description: '',
      version: '1.0.0',
      author: objAuthor,
      license: 'MIT',
      interface: objInterface,
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN a manifest with a bare-string author (Claude→Codex mistake) WHEN parsed THEN the schema rejects it', () => {
    const result = PluginManifestSchema.safeParse({
      name: 'test',
      description: 'test',
      version: '1.0.0',
      author: 'X',
      license: 'MIT',
      interface: objInterface,
    });
    expect(result.success).toBe(false);
  });

  it('GIVEN a manifest missing interface WHEN parsed THEN the schema rejects it', () => {
    const result = PluginManifestSchema.safeParse({
      name: 'test',
      description: 'test',
      version: '1.0.0',
      author: objAuthor,
      license: 'MIT',
    });
    expect(result.success).toBe(false);
  });
});
