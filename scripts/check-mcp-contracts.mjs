/** Validate authored tool references and example inputs against discovered schemas.
 * Accepts a tools/list result {tools:[{name,inputSchema}]} or portal schema snapshot.
 * No credentials or live calls. Refresh --snapshot before each submission.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  if (!process.argv[index + 1]) throw new Error(`Missing ${name} value`);
  return resolve(process.argv[index + 1]);
};
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const snapshotPath = option('--snapshot', join(root, 'export/chatgpt/mcp-input-schemas.json'));
const examplesPath = option('--examples', join(root, 'export/chatgpt/contract-examples.json'));
const discovered = read(snapshotPath);
const tools = discovered.tools ?? discovered.result?.tools;
if (!Array.isArray(tools) || tools.length === 0) throw new Error('Snapshot must contain tools/list definitions');
const contracts = new Map(tools.map(t => [t.name, t.inputSchema]));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const files = [join(root, '.codex/agents/lantern-analyst.toml'), join(root, 'export/chatgpt/metadata.json')];
const marketplace = read(join(root, '.agents/plugins/marketplace.json'));
for (const plugin of marketplace.plugins) {
  const skillsPath = join(root, plugin.source.path, 'skills');
  for (const skill of readdirSync(skillsPath)) files.push(join(skillsPath, skill, 'SKILL.md'));
}
const refs = new Set();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (/\bfindings\.[a-z][a-z0-9_]*/.test(text)) throw new Error(`Obsolete tool namespace in ${file}`);
  for (const ref of text.match(/\b(?:findings-interpreter|account-manager)\.[a-z][a-z0-9_]*/g) ?? []) refs.add(ref);
}
const examples = read(examplesPath).calls;
const covered = new Set();
for (const call of examples) {
  const schema = contracts.get(call.name);
  if (!schema) throw new Error(`Missing discovered tool: ${call.name}`);
  const validate = ajv.compile(schema);
  if (!validate(call.arguments)) throw new Error(`${call.name}: ${ajv.errorsText(validate.errors)}`);
  // These constraints are documented by the tool but not encoded in its schema.
  if (call.name.endsWith('.get_product_detail') &&
      Number('product_id' in call.arguments) + Number('product_key' in call.arguments) !== 1)
    throw new Error('Product detail requires exactly one returned product identifier');
  if ('end_date' in call.arguments && ('start' in call.arguments || 'end' in call.arguments))
    throw new Error('Cannot combine end_date with a custom range');
  if (('start' in call.arguments) !== ('end' in call.arguments)) throw new Error('Custom ranges require start and end');
  covered.add(call.name);
}
for (const ref of refs) {
  if (!contracts.has(ref)) throw new Error(`Authored tool not discovered: ${ref}`);
  if (!covered.has(ref)) throw new Error(`No schema-checked example for ${ref}`);
}
console.log(`Validated ${refs.size} authored tool references and ${examples.length} example calls against ${snapshotPath}.`);
console.log('Schema validation only: no live calls, reviewer fixtures, or web/mobile results are verified.');
