import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PLUGINS,
  KNOWN_TOOLS,
  repoRoot,
  findingsSkillDirs,
  agentPath,
  collectToolRefs,
} from './repo.js';

/** Gather every text blob (skill bodies + the agent persona) across all plugins. */
function allTextBlobs(): string[] {
  const blobs: string[] = [];
  const root = repoRoot();
  for (const plugin of PLUGINS) {
    for (const skill of findingsSkillDirs(plugin)) {
      const skillPath = join(root, 'plugins', plugin, 'skills', skill, 'SKILL.md');
      blobs.push(readFileSync(skillPath, 'utf-8'));
    }
  }
  blobs.push(readFileSync(agentPath(), 'utf-8'));
  return blobs;
}

describe('tool integrity', () => {
  it('GIVEN all skills and the agent WHEN tool refs collected THEN every ref is in KNOWN_TOOLS', () => {
    const blobs = allTextBlobs();
    const allRefs = new Set<string>();
    for (const blob of blobs) {
      for (const ref of collectToolRefs(blob)) {
        allRefs.add(ref);
      }
    }
    const knownSet = new Set(KNOWN_TOOLS);
    const invented = [...allRefs].filter((ref) => !knownSet.has(ref));
    expect(invented, `Invented (unknown) tool refs: ${invented.join(', ')}`).toEqual([]);
  });

  it('GIVEN all content WHEN searched THEN account-manager.get_brands appears at least once (bootstrap tool present)', () => {
    const allText = allTextBlobs().join('\n');
    const refs = collectToolRefs(allText);
    expect(refs).toContain('account-manager.get_brands');
  });

  it('GIVEN the agent persona WHEN bare refs collected THEN result is non-empty (bare shorthand detected)', () => {
    const agentBody = readFileSync(agentPath(), 'utf-8');
    const refs = collectToolRefs(agentBody);
    expect(refs.length, 'Expected bare tool refs to be detected in the agent body').toBeGreaterThan(0);
  });

  it('GIVEN a text blob with a bare typo (get_brand_scoers) WHEN refs collected THEN the typo surfaces as an invented ref', () => {
    const blobWithTypo =
      'Call `get_brand_scoers` and `get_brand_overview` for this brand. Also use `account-manager.get_brands`.';
    const refs = collectToolRefs(blobWithTypo);
    const knownSet = new Set(KNOWN_TOOLS);
    const invented = refs.filter((r) => !knownSet.has(r));
    expect(invented).toContain('findings.get_brand_scoers');
  });

  it('GIVEN KNOWN_TOOLS WHEN all artifacts scanned THEN every entry appears at least once (no dead/fictional tools)', () => {
    const allText = allTextBlobs().join('\n');
    const allRefs = new Set(collectToolRefs(allText));
    const missing = KNOWN_TOOLS.filter((tool) => !allRefs.has(tool));
    expect(
      missing,
      `KNOWN_TOOLS entries with zero artifact coverage (dead or fictional): ${missing.join(', ')}`,
    ).toEqual([]);
  });
});

describe('collectToolRefs helper', () => {
  it('GIVEN text with tool references WHEN collected THEN returns deduped list', () => {
    const text =
      'call `account-manager.get_brands`, then `findings.get_brand_overview` and again `account-manager.get_brands`';
    const refs = collectToolRefs(text);
    expect(refs).toContain('account-manager.get_brands');
    expect(refs).toContain('findings.get_brand_overview');
    const count = refs.filter((r) => r === 'account-manager.get_brands').length;
    expect(count).toBe(1);
  });

  it('GIVEN text with no tool references WHEN collected THEN returns empty array', () => {
    expect(collectToolRefs('no tools here')).toEqual([]);
  });

  it('GIVEN empty string WHEN collected THEN returns empty array', () => {
    expect(collectToolRefs('')).toEqual([]);
  });

  it('GIVEN text where findings. appears at a word boundary WHEN collected THEN matches correctly', () => {
    const text = 'use findings.get_overview_attention but not xfindings.get_overview_attention';
    const refs = collectToolRefs(text);
    expect(refs).toContain('findings.get_overview_attention');
    const xRefs = refs.filter((r) => r === 'findings.get_overview_attention');
    expect(xRefs.length).toBe(1);
  });

  it('GIVEN text with findings.getOverview (camelCase) WHEN collected THEN it is NOT matched', () => {
    const refs = collectToolRefs('use findings.getOverview here');
    expect(refs).not.toContain('findings.getOverview');
    expect(refs).not.toContain('findings.get');
  });

  it('GIVEN text with findings.get_overview_attention2 WHEN collected THEN it is captured as-is (not silently collapsed)', () => {
    const refs = collectToolRefs('call findings.get_overview_attention2 here');
    expect(refs).toContain('findings.get_overview_attention2');
    expect(refs).not.toContain('findings.get_overview_attention');
  });

  it('GIVEN text with bare get_brand_overview WHEN collected THEN findings.get_brand_overview is returned', () => {
    const refs = collectToolRefs('Call `get_brand_overview` for the brand.');
    expect(refs).toContain('findings.get_brand_overview');
  });

  it('GIVEN text with bare compare_brands WHEN collected THEN findings.compare_brands is returned', () => {
    const refs = collectToolRefs('Use compare_brands to compare.');
    expect(refs).toContain('findings.compare_brands');
  });

  it('GIVEN text with bare get_citation_trend WHEN collected THEN findings.get_citation_trend is returned', () => {
    const refs = collectToolRefs('Use get_citation_trend.');
    expect(refs).toContain('findings.get_citation_trend');
  });

  it('GIVEN text with a namespaced account-manager ref WHEN collected THEN only the prefixed form is returned', () => {
    const refs = collectToolRefs('Call account-manager.get_brands first.');
    expect(refs).toEqual(['account-manager.get_brands']);
  });

  it('GIVEN text with a bare typo get_brand_scoers WHEN collected THEN it normalises to findings.get_brand_scoers (not a known tool)', () => {
    const refs = collectToolRefs('Call `get_brand_scoers` here.');
    expect(refs).toContain('findings.get_brand_scoers');
    const knownSet = new Set(KNOWN_TOOLS);
    expect(knownSet.has('findings.get_brand_scoers')).toBe(false);
  });
});
