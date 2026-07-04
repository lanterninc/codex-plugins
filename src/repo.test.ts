import { describe, it, expect, afterEach } from 'vitest';
import { repoRoot, readJson, loadFrontmatter, loadAgentToml, listPlugins, PLUGINS } from './repo.js';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('listPlugins()', () => {
  it('GIVEN marketplace.json WHEN listPlugins() called THEN returns the declared plugin names', () => {
    const names = listPlugins();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      expect(existsSync(join(repoRoot(), 'plugins', n))).toBe(true);
    }
  });
});

describe('repoRoot()', () => {
  it('GIVEN the module is loaded WHEN repoRoot() called THEN returns a directory that exists', () => {
    const root = repoRoot();
    expect(existsSync(root)).toBe(true);
  });

  it('GIVEN repoRoot() WHEN package.json checked at root THEN it exists', () => {
    expect(existsSync(join(repoRoot(), 'package.json'))).toBe(true);
  });
});

describe('readJson()', () => {
  it('GIVEN a valid relative path WHEN readJson called THEN returns parsed JSON', () => {
    const result = readJson('.agents/plugins/marketplace.json');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('GIVEN a non-existent path WHEN readJson called THEN throws', () => {
    expect(() => readJson('nonexistent/file.json')).toThrow();
  });
});

describe('loadFrontmatter()', () => {
  const firstPlugin: string = PLUGINS[0] ?? '';

  it('GIVEN a valid markdown file WHEN loadFrontmatter called THEN returns data and body', () => {
    const path = join(repoRoot(), 'plugins', firstPlugin, 'skills/ai-visibility/SKILL.md');
    const { data, body } = loadFrontmatter(path);
    expect(typeof data).toBe('object');
    expect(typeof body).toBe('string');
    expect(body.length).toBeGreaterThan(0);
  });

  it('GIVEN a file with no frontmatter WHEN loadFrontmatter called THEN data is empty object and body is the full content', () => {
    const readmePath = join(repoRoot(), 'plugins', firstPlugin, 'README.md');
    const { data, body } = loadFrontmatter(readmePath);
    expect(Object.keys(data).length).toBe(0);
    expect(typeof body).toBe('string');
  });
});

describe('loadAgentToml()', () => {
  let tmpDir: string;
  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GIVEN a TOML with developer_instructions WHEN loaded THEN body is the instructions string', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agent-toml-'));
    const p = join(tmpDir, 'a.toml');
    writeFileSync(p, 'name = "x"\ndeveloper_instructions = "do the thing"\n');
    const { data, body } = loadAgentToml(p);
    expect(data['name']).toBe('x');
    expect(body).toBe('do the thing');
  });

  it('GIVEN a TOML with no developer_instructions WHEN loaded THEN body falls back to an empty string', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agent-toml-'));
    const p = join(tmpDir, 'a.toml');
    writeFileSync(p, 'name = "x"\n');
    const { body } = loadAgentToml(p);
    expect(body).toBe('');
  });
});
