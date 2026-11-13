import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from './repo.js';
const root = repoRoot();
const run = (args: string[] = []) => execFileSync(process.execPath, ['scripts/check-mcp-contracts.mjs', ...args], { cwd: root, stdio: 'pipe' }).toString();
function mutatedExample(change: (call: { name: string; arguments: Record<string, unknown> }) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'lantern-contract-'));
  try {
    const examples = JSON.parse(readFileSync(join(root, 'export/chatgpt/contract-examples.json'), 'utf8')) as { calls: Array<{ name: string; arguments: Record<string, unknown> }> };
    examples.calls.forEach(change);
    const path = join(dir, 'examples.json');
    writeFileSync(path, JSON.stringify(examples));
    return run(['--examples', path]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
describe('MCP submission contracts', () => {
  it('validates package and review references against observed input schemas', () => {
    expect(run()).toContain('Validated 19 authored tool references');
  });
  it('rejects the former accountBrandId payload for a brand_id tool', () => {
    expect(() => mutatedExample(call => {
      if (call.name.endsWith('.get_citations')) {
        call.arguments['accountBrandId'] = call.arguments['brand_id'];
        delete call.arguments['brand_id'];
      }
    })).toThrow();
  });
  it('rejects the reverse brand argument mismatch on action tools', () => {
    expect(() => mutatedExample(call => {
      if (call.name.endsWith('.get_action_queue')) {
        call.arguments['brand_id'] = call.arguments['accountBrandId'];
        delete call.arguments['accountBrandId'];
      }
    })).toThrow();
  });
  it('rejects both product identifiers even though the JSON schema permits them', () => {
    expect(() => mutatedExample(call => {
      if (call.name.endsWith('.get_product_detail')) call.arguments['product_key'] = 'fabricated-key';
    })).toThrow();
  });
  it('fails when the server snapshot removes a required operation', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lantern-schema-'));
    try {
      const snapshot = JSON.parse(readFileSync(join(root, 'export/chatgpt/mcp-input-schemas.json'), 'utf8')) as { tools: Array<{ name: string }> };
      snapshot.tools = snapshot.tools.filter(t => !t.name.endsWith('.compare_brands'));
      const path = join(dir, 'snapshot.json');
      writeFileSync(path, JSON.stringify(snapshot));
      expect(() => run(['--snapshot', path])).toThrow();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
