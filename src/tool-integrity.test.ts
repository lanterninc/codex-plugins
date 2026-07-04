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

  it('GIVEN all content WHEN searched THEN findings.get_visibility_brands appears at least once (bootstrap tool present)', () => {
    const allText = allTextBlobs().join('\n');
    const refs = collectToolRefs(allText);
    expect(refs).toContain('findings.get_visibility_brands');
  });

  it('GIVEN the agent persona WHEN bare refs collected THEN result is non-empty (bare shorthand detected)', () => {
    const agentBody = readFileSync(agentPath(), 'utf-8');
    const refs = collectToolRefs(agentBody);
    expect(refs.length, 'Expected bare tool refs to be detected in the agent body').toBeGreaterThan(0);
  });

  it('GIVEN a text blob with a bare typo (get_brand_scoers) WHEN refs collected THEN the typo surfaces as an invented ref', () => {
    const blobWithTypo =
      'Call `get_brand_scoers` and `get_overview` for this brand. Also use `findings.get_visibility_brands`.';
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
      'call `findings.get_visibility_brands`, then `findings.get_brand_scores` and again `findings.get_visibility_brands`';
    const refs = collectToolRefs(text);
    expect(refs).toContain('findings.get_visibility_brands');
    expect(refs).toContain('findings.get_brand_scores');
    const count = refs.filter((r) => r === 'findings.get_visibility_brands').length;
    expect(count).toBe(1);
  });

  it('GIVEN text with no tool references WHEN collected THEN returns empty array', () => {
    expect(collectToolRefs('no tools here')).toEqual([]);
  });

  it('GIVEN empty string WHEN collected THEN returns empty array', () => {
    expect(collectToolRefs('')).toEqual([]);
  });

  it('GIVEN text where findings. appears at a word boundary WHEN collected THEN matches correctly', () => {
    const text = 'use findings.get_overview but not xfindings.get_overview';
    const refs = collectToolRefs(text);
    expect(refs).toContain('findings.get_overview');
    const xRefs = refs.filter((r) => r === 'findings.get_overview');
    expect(xRefs.length).toBe(1);
  });

  it('GIVEN text with findings.getOverview (camelCase) WHEN collected THEN it is NOT matched', () => {
    const refs = collectToolRefs('use findings.getOverview here');
    expect(refs).not.toContain('findings.getOverview');
    expect(refs).not.toContain('findings.get');
  });

  it('GIVEN text with findings.get_overview2 WHEN collected THEN it is captured as-is (not silently collapsed)', () => {
    const refs = collectToolRefs('call findings.get_overview2 here');
    expect(refs).toContain('findings.get_overview2');
    expect(refs).not.toContain('findings.get_overview');
  });

  it('GIVEN text with bare get_brand_scores WHEN collected THEN findings.get_brand_scores is returned', () => {
    const refs = collectToolRefs('Call `get_brand_scores` for the brand.');
    expect(refs).toContain('findings.get_brand_scores');
  });

  it('GIVEN text with bare compare_brands WHEN collected THEN findings.compare_brands is returned', () => {
    const refs = collectToolRefs('Use compare_brands to compare.');
    expect(refs).toContain('findings.compare_brands');
  });

  it('GIVEN text with bare explain_citation_telemetry WHEN collected THEN findings.explain_citation_telemetry is returned', () => {
    const refs = collectToolRefs('Use explain_citation_telemetry.');
    expect(refs).toContain('findings.explain_citation_telemetry');
  });

  it('GIVEN text with bare check_analysis_status WHEN collected THEN findings.check_analysis_status is returned', () => {
    const refs = collectToolRefs('Call check_analysis_status now.');
    expect(refs).toContain('findings.check_analysis_status');
  });

  it('GIVEN text with a bare typo get_brand_scoers WHEN collected THEN it normalises to findings.get_brand_scoers (not a known tool)', () => {
    const refs = collectToolRefs('Call `get_brand_scoers` here.');
    expect(refs).toContain('findings.get_brand_scoers');
    const knownSet = new Set(KNOWN_TOOLS);
    expect(knownSet.has('findings.get_brand_scoers')).toBe(false);
  });
});
