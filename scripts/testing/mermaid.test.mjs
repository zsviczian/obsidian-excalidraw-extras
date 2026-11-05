/** Exercise the actual Extras loader and Pele converter without Obsidian or network. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test, { after } from 'node:test';
import { sourceHarness } from './sourceHarness.mjs';

const graph = sourceHarness();
const { getMermaidVersion, getModule } = await graph.importModule('src/MermaidToExcalidraw/index.ts');
after(() => graph.close());

test('advertises the required 3.6 service contract and supplies converter 3.6', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(getMermaidVersion(), '3.6.0');
  assert.equal(pkg.dependencies['@excalidraw/mermaid-to-excalidraw'], '3.6.0');
});

for (const [name, definition, labels] of [
  ['flowchart', 'flowchart LR\n A[Start] --> B[Finish]', ['Start', 'Finish']],
  ['sequence', 'sequenceDiagram\n Alice->>Bob: Hello', ['Alice', 'Bob', 'Hello']],
]) {
  test(`loads ${name} and preserves its headless SVG fallback`, async (t) => {
    // The browser's native-element path is exercised in the Obsidian vault.
    // Node has no DOMParser, so v3 deliberately falls back to an SVG image.
    t.mock.method(console, 'error', () => {});
    const { parseMermaidToExcalidraw } = await getModule();
    const result = await parseMermaidToExcalidraw(definition);
    assert.equal(result.elements.length, 1);
    assert.equal(result.elements[0].type, 'image');
    const file = Object.values(result.files)[0];
    assert.equal(file.mimeType, 'image/svg+xml');
    const text = Buffer.from(file.dataURL.split(',')[1], 'base64').toString('utf8');
    for (const label of labels) assert.ok(text.includes(label), label);
    assert.ok(result.elements[0].width > 0 && result.elements[0].height > 0);
  });
}

test('reports syntax errors and enforces caller text limits', async () => {
  const { parseMermaidToExcalidraw } = await getModule();
  await assert.rejects(parseMermaidToExcalidraw('flowchart TD\n A['));
  await assert.rejects(parseMermaidToExcalidraw('flowchart TD\n A --> B', { maxTextSize: 5 }));
});

test('retains legacy linear/basis curves, source overrides, limits and original error lines', async (t) => {
  t.mock.method(console, 'error', () => {});
  const { parseMermaidToExcalidraw } = await getModule();
  const source = 'flowchart TD\n A --> B\n A --> C\n B --> D\n C --> D';
  const svg = async (definition, config) => {
    const result = await parseMermaidToExcalidraw(definition, config);
    return Buffer.from(Object.values(result.files)[0].dataURL.split(',')[1], 'base64').toString('utf8');
  };
  const linear = await svg(source, { flowchart: { curve: 'linear' } });
  const basis = await svg(source, { flowchart: { curve: 'basis' } });
  assert.notEqual(basis, linear, 'legacy curve must change rendered connector geometry');
  for (const definition of [
    '---\nconfig:\n  flowchart:\n    curve: linear\n---\n' + source,
    "%%{init: {'flowchart': {'curve': 'linear'}}}%%\n" + source,
  ]) {
    assert.equal(
      await svg(definition, { flowchart: { curve: 'basis' } }),
      await svg(definition, { flowchart: { curve: 'linear' } }),
      'definition curve must override the caller default',
    );
  }
  await assert.rejects(parseMermaidToExcalidraw(source, { flowchart: { curve: 'basis' }, maxTextSize: 5 }));
  await assert.rejects(
    parseMermaidToExcalidraw('%% a\n%% b\nflowchart TD\n A --> B\n C --> D]', { flowchart: { curve: 'basis' } }),
    /line 5\b/,
  );
});
