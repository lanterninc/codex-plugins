import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import {
  FORBIDDEN_TOOL_PATTERNS,
  KNOWN_TOOLS,
  agentPath,
  loadAgentToml,
  collectToolRefs,
} from './repo.js';
import { AgentTomlSchema } from './schemas.js';

describe('lantern-analyst subagent (.codex/agents/lantern-analyst.toml)', () => {
  it('GIVEN the agent TOML WHEN existence checked THEN the file is present at the repo root', () => {
    expect(existsSync(agentPath())).toBe(true);
  });

  it('GIVEN the agent TOML WHEN parsed THEN it matches AgentTomlSchema', () => {
    const { data } = loadAgentToml(agentPath());
    const result = AgentTomlSchema.safeParse(data);
    expect(result.success, result.error?.message).toBe(true);
  });

  it("GIVEN the agent WHEN name read THEN it is exactly 'lantern-analyst'", () => {
    const fm = AgentTomlSchema.parse(loadAgentToml(agentPath()).data);
    // The name is the /agent invocation contract and is coupled to the filename.
    expect(fm.name).toBe('lantern-analyst');
  });

  it('GIVEN the agent WHEN description read THEN it is non-empty', () => {
    const fm = AgentTomlSchema.parse(loadAgentToml(agentPath()).data);
    expect(fm.description.trim().length).toBeGreaterThan(0);
  });

  it('GIVEN the agent WHEN sandbox_mode read THEN it is read-only (the persona is strictly read-only)', () => {
    const fm = AgentTomlSchema.parse(loadAgentToml(agentPath()).data);
    expect(fm.sandbox_mode).toBe('read-only');
  });

  it('GIVEN the agent developer_instructions WHEN tool refs collected THEN only KNOWN_TOOLS are referenced', () => {
    const { body } = loadAgentToml(agentPath());
    const refs = collectToolRefs(body);
    const knownSet = new Set(KNOWN_TOOLS);
    expect(refs.length, 'expected bare tool refs in the agent instructions').toBeGreaterThan(0);
    const invented = refs.filter((r) => !knownSet.has(r));
    expect(invented, `agent instructions reference invented tools: ${invented.join(', ')}`).toEqual([]);
  });

  it('GIVEN the agent developer_instructions WHEN checked for forbidden patterns THEN none are present', () => {
    const { body } = loadAgentToml(agentPath());
    for (const pattern of FORBIDDEN_TOOL_PATTERNS) {
      expect(pattern.test(body), `Forbidden pattern ${pattern} found in agent instructions`).toBe(false);
    }
  });
});
