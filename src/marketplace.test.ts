import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { loadMarketplace, repoRoot } from './repo.js';
import { MarketplaceSchema, PluginManifestSchema } from './schemas.js';

describe('marketplace.json', () => {
  it('GIVEN the marketplace file exists WHEN parsed THEN it matches the schema', () => {
    const raw = loadMarketplace();
    const result = MarketplaceSchema.safeParse(raw);
    expect(result.success, result.error?.message).toBe(true);
  });

  it('GIVEN the marketplace WHEN read THEN it has a non-empty name', () => {
    const parsed = MarketplaceSchema.parse(loadMarketplace());
    expect(parsed.name.length).toBeGreaterThan(0);
  });

  it('GIVEN the marketplace WHEN read THEN it has a non-empty interface displayName', () => {
    const parsed = MarketplaceSchema.parse(loadMarketplace());
    expect(parsed.interface.displayName.length).toBeGreaterThan(0);
  });

  it('GIVEN each plugin entry WHEN source discriminator checked THEN it is a local source', () => {
    const parsed = MarketplaceSchema.parse(loadMarketplace());
    for (const plugin of parsed.plugins) {
      expect(plugin.source.source).toBe('local');
      expect(plugin.source.path.length).toBeGreaterThan(0);
    }
  });

  it('GIVEN the marketplace WHEN plugins listed THEN at least one plugin is declared with unique names', () => {
    const parsed = MarketplaceSchema.parse(loadMarketplace());
    const names = parsed.plugins.map((p) => p.name);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });

  it('GIVEN each plugin entry WHEN source.path is resolved THEN the directory exists on disk', () => {
    const parsed = MarketplaceSchema.parse(loadMarketplace());
    for (const plugin of parsed.plugins) {
      const absSource = join(repoRoot(), plugin.source.path);
      expect(existsSync(absSource), `source dir ${plugin.source.path} does not exist`).toBe(true);
    }
  });

  it('GIVEN each plugin entry WHEN plugin.json loaded THEN plugin.json name === marketplace entry name', () => {
    const parsed = MarketplaceSchema.parse(loadMarketplace());
    for (const entry of parsed.plugins) {
      const absSource = join(repoRoot(), entry.source.path);
      const manifestRaw = JSON.parse(
        readFileSync(join(absSource, '.codex-plugin', 'plugin.json'), 'utf-8'),
      ) as unknown;
      const manifest = PluginManifestSchema.parse(manifestRaw);
      expect(
        manifest.name,
        `plugin.json name "${manifest.name}" does not match marketplace entry name "${entry.name}"`,
      ).toBe(entry.name);
    }
  });

  it('GIVEN each plugin entry WHEN source basename checked THEN basename(source.path) === entry.name', () => {
    const parsed = MarketplaceSchema.parse(loadMarketplace());
    for (const entry of parsed.plugins) {
      const dirName = basename(entry.source.path);
      expect(
        dirName,
        `basename of source "${entry.source.path}" is "${dirName}", expected "${entry.name}"`,
      ).toBe(entry.name);
    }
  });

  it('GIVEN an object missing required fields WHEN parsed THEN the schema rejects it', () => {
    const result = MarketplaceSchema.safeParse({ name: 'x' });
    expect(result.success).toBe(false);
  });
});
