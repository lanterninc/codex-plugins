import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { CUSTOMER_SKILLS, PLUGINS, repoRoot, listSkillDirs, agentPath } from './repo.js';
import { join } from 'node:path';

describe('plugin completeness', () => {
  for (const plugin of PLUGINS) {
    describe(`plugin: ${plugin}`, () => {
      it('GIVEN the plugin WHEN skill dirs listed THEN all 6 customer skills are present', () => {
        const skills = listSkillDirs(plugin);
        for (const expected of CUSTOMER_SKILLS) {
          expect(skills, `Missing customer skill: ${expected}`).toContain(expected);
        }
      });
    });
  }

  it('GIVEN the repo WHEN the agent persona path checked THEN .codex/agents/lantern-analyst.toml exists', () => {
    expect(existsSync(agentPath())).toBe(true);
  });
});

describe('repo path helpers', () => {
  it('GIVEN repoRoot() WHEN called THEN returns a path containing package.json', () => {
    const root = repoRoot();
    expect(existsSync(join(root, 'package.json'))).toBe(true);
  });

  it('GIVEN listSkillDirs for a non-existent plugin WHEN called THEN returns empty array', () => {
    const result = listSkillDirs('nonexistent-plugin');
    expect(result).toEqual([]);
  });
});
