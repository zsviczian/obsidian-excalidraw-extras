/** Exercise the actual Extras loader and Pele converter without Obsidian or network. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getMermaidVersion, getModule } from '../../src/MermaidToExcalidraw/index.ts';

test('advertises the exact converter version supplied by Extras', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(getMermaidVersion(), '3.0.0');
  assert.equal(pkg.dependencies['@excalidraw/mermaid-to-excalidraw'], getMermaidVersion());
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
