import {sourceIdentity} from './provenance.mjs';
/** Actual production bundle and renderers; only the Obsidian host is structural. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = resolve(process.env.EXCALIDRAW_TEST_REPORT_DIR || join(root, '.test-work/reports/browser'));
mkdirSync(output, { recursive: true });
const bytes = readFileSync(join(root, 'dist/main.js'));
const report = { source: sourceIdentity(root), schemaVersion: 2, suiteId: 'extras-browser', status: 'failed', cleanup: 'not-started',
  tests: [], artifact: { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length },
  toolchain: { node: process.version, platform: process.platform }, errors: [], externalRequests: [] };
let server, browser;
try {
  server = createServer((request, response) => {
    if (request.url === '/obsidian-excalidraw-extras/main.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bytes); }
    else if (request.url === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><meta charset="utf-8"><body><main id="output"></main></body>'); }
    else { response.writeHead(404); response.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true }); report.browser = browser.version();
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || ['data:', 'blob:', 'about:'].includes(url.protocol)) return route.continue();
    report.externalRequests.push(url.href); return route.abort();
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => {
    const disposers = [], settings = { enableMathJaxToSVG: false, enableMermaidToExcalidraw: false, enablePDFExport: false, enableFileSystem: false };
    class Plugin {
      constructor(app) { this.app = app; this.writes = []; }
      async loadData() { return { ...settings }; }
      async saveData(value) { this.writes.push({ ...value }); }
      register(dispose) { disposers.push(dispose); }
      registerEvent(event) { disposers.push(event); }
      addSettingTab() {}
    }
    const host = { Plugin, App: class {}, Notice: class {}, Platform: { isIosApp: false }, PluginSettingTab: class {}, Setting: class {} };
    window.require = name => { if (name !== 'obsidian') throw Error('Unexpected external dependency: ' + name); return host; };
    window.module = { exports: {} }; window.exports = window.module.exports;
    window.__extrasHost = { app: { workspace: { containerEl: document.body, on: () => () => {}, onLayoutReady: callback => callback(), iterateAllLeaves() {} } }, dispose: () => { for (const dispose of disposers.reverse()) dispose(); } };
  });
  await page.addScriptTag({ url: '/obsidian-excalidraw-extras/main.js' });
  await page.evaluate(async () => {
    const Extras = window.module.exports;
    window.__extras = new Extras(window.__extrasHost.app); await window.__extras.onload();
  });
  const run = async (id, execute, argument) => {
    try { report.tests.push({ testId: 'extras-browser:' + id, featureIds: [], status: 'passed', evidence: await page.evaluate(execute, argument) }); }
    catch (error) { report.tests.push({ testId: 'extras-browser:' + id, featureIds: [], status: 'failed', reason: String(error.stack || error) }); throw error; }
  };
  await run('activation-and-real-mathjax', async () => {
    const p = window.__extras, api = p.api;
    if (await api.mathjax.tex2dataURL('x') !== null) throw Error('Disabled MathJax executed');
    await api.features.enable('mathjax', -1);
    const result = await api.mathjax.tex2dataURL('\\frac{a^2+b^2}{\\sqrt{c}}', 1, null, { throwOnError: true });
    if (!result || result.mimeType !== 'image/svg+xml' || !/^[a-f0-9]{40}$/.test(result.fileId)) throw Error('MathJax result contract differs');
    const svg = new DOMParser().parseFromString(atob(result.dataURL.split(',')[1]), 'image/svg+xml');
    if (svg.querySelector('parsererror') || !svg.querySelector('path')) throw Error('MathJax did not return drawable SVG');
    const image = new Image(); image.src = result.dataURL; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let nontransparent = 0; for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) nontransparent++;
    if (!nontransparent || result.size.width <= 0 || result.size.height <= 0 || p.writes.length) throw Error('MathJax pixels, geometry or session activation differs');
    document.getElementById('output').append(document.importNode(svg.documentElement, true));
    return { assertions: ['disabled service returns null', 'real MathJax draws offline SVG', 'decoded nonempty pixels', 'positive dimensions', 'session enable does not persist'], width: canvas.width, height: canvas.height, nontransparent };
  });
  await run('strict-error-recovery', async () => {
    let rejected = false;
    try { await window.__extras.api.mathjax.tex2dataURL('\\unknowncommand{', 1, null, { throwOnError: true }); } catch { rejected = true; }
    if (!rejected) throw Error('Invalid strict TeX was accepted');
    const recovered = await window.__extras.api.mathjax.tex2dataURL('x^2', 1, null, { throwOnError: true });
    if (!recovered?.dataURL) throw Error('Renderer failed to recover');
    return { assertions: ['strict invalid TeX rejects', 'next valid render succeeds'] };
  });
  await run('real-mermaid-editable-and-image', async () => {
    const api = window.__extras.api;
    let disabled = false; try { await api.mermaid.getModule(); } catch { disabled = true; }
    if (!disabled) throw Error('Disabled Mermaid executed');
    await api.features.enable('mermaid', -1);
    const mermaid = await api.mermaid.getModule();
    const editable = await mermaid.parseMermaidToExcalidraw('flowchart TD\n A[Start] --> B[End]');
    if (!editable.elements?.length || !editable.elements.some(e => e.type === 'arrow') || !editable.elements.some(e => e.type === 'text' || e.label?.text === 'Start')) throw Error('Mermaid editable conversion missing: ' + JSON.stringify(editable).slice(0,1200));
    const image = await mermaid.parseMermaidToExcalidraw('pie title Test\n "A" : 60\n "B" : 40');
    if (!image.files || !Object.values(image.files).some(file => file.dataURL?.startsWith('data:image/svg+xml'))) throw Error('Mermaid image conversion missing');
    const source = Object.values(image.files).find(file => file.dataURL?.startsWith('data:image/svg+xml'));
    const decoded = new Image(); decoded.src = source.dataURL; await decoded.decode();
    const canvas = document.createElement('canvas'); canvas.width = decoded.naturalWidth; canvas.height = decoded.naturalHeight;
    const context = canvas.getContext('2d'); context.drawImage(decoded, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i]) painted++;
    if (painted < 50) throw Error('Mermaid fallback does not decode into visible pixels');
    return { assertions: ['disabled Mermaid rejects', 'real flowchart retains editable text and arrow', 'image-only diagram decodes visible SVG pixels'], editableElements: editable.elements.length, files: Object.keys(image.files).length, painted };
  });
  // PR #478: each first-use Pele chunk must execute from the single installed
  // bundle. The server serves no chunks, and remote requests fail the suite.
  for (const fixture of JSON.parse(readFileSync(join(root, 'tests/mermaid-diagrams.json'), 'utf8'))) {
    await run('mermaid-offline-' + fixture.id, async ({ definition, editable, labels }) => {
      const converter = await window.__extras.api.mermaid.getModule();
      const result = await converter.parseMermaidToExcalidraw(definition);
      // Converter skeletons may omit dimensions (arrows derive them from points).
      // Native integration separately checks the normalized scene dimensions.
      if (!result.elements?.length || result.elements.some(e => ['x', 'y', 'width', 'height'].some(key => key in e && !Number.isFinite(e[key])))) throw Error('Missing or invalid skeleton geometry');
      if (editable) {
        if (result.elements.some(e => e.type === 'image')) throw Error('Editable diagram became an image');
        const text = result.elements.map(e => e.text || e.label?.text || '').join('\n');
        for (const label of labels) if (!text.includes(label)) throw Error('Lost label: ' + label);
        return { assertions: ['offline first-use conversion', 'finite geometry', 'editable representation and labels'], elements: result.elements.length };
      }
      const image = result.elements.find(e => e.type === 'image'), file = result.files?.[image?.fileId];
      if (!file?.dataURL?.startsWith('data:image/svg+xml')) throw Error('Image source missing');
      const svg = new DOMParser().parseFromString(atob(file.dataURL.split(',')[1]), 'image/svg+xml');
      if (svg.querySelector('parsererror')) throw Error('Invalid SVG');
      for (const label of labels) if (!svg.documentElement.textContent.includes(label)) throw Error('Lost SVG label: ' + label);
      const decoded = new Image(); decoded.src = file.dataURL; await decoded.decode();
      const canvas = document.createElement('canvas'); canvas.width = decoded.naturalWidth; canvas.height = decoded.naturalHeight;
      const context = canvas.getContext('2d'); context.drawImage(decoded, 0, 0);
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let painted = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i]) painted++;
      if (painted < 50) throw Error('Empty rendered image');
      return { assertions: ['offline first-use conversion', 'finite geometry', 'SVG labels and decoded visible pixels'], painted, width: canvas.width, height: canvas.height };
    }, fixture);
  }
  await run('mermaid-error-recovery', async () => {
    const converter = await window.__extras.api.mermaid.getModule();
    for (const [definition, options] of [['flowchart TD\n A[', {}], ['flowchart TD\n A --> B', { maxTextSize: 5 }]]) {
      let rejected = false; try { await converter.parseMermaidToExcalidraw(definition, options); } catch { rejected = true; }
      if (!rejected) throw Error('Invalid source/limit accepted');
    }
    const recovered = await converter.parseMermaidToExcalidraw('sequenceDiagram\n Alice->>Bob: Recovered');
    if (!recovered.elements.length) throw Error('Converter failed to recover');
    return { assertions: ['syntax and limits reject', 'a different diagram type recovers'] };
  });
  await run('desktop-capabilities-and-unload', async () => {
    const p = window.__extras;
    await p.api.features.enable('pdf', -1);
    let rejected = false; try { await p.api.pdf.exportToPDF(document.body, 'forbidden.pdf'); } catch (error) { rejected = /desktop Electron/.test(String(error)); }
    if (!rejected || document.querySelector('.excalidraw-pdf-export')) throw Error('Browser PDF capability failure leaked resources');
    p.onunload(); window.__extrasHost.dispose();
    let unloaded = false; try { await p.api.features.enable('mermaid', -1); } catch (error) { unloaded = /unloaded/.test(String(error)); }
    if (!unloaded || p.api.features.isActive('mermaid')) throw Error('Old API survived unload');
    return { assertions: ['missing Electron rejects before allocation', 'old API cannot reactivate after unload', 'owned observers disposed'] };
  });
  assert.deepEqual(report.externalRequests, [], 'Offline renderer attempted a remote request');
  assert.deepEqual(report.errors, [], 'Unexpected renderer errors');
  await page.screenshot({ path: join(output, 'renderers.png') }); await page.close();
  report.status = 'passed';
} catch (error) { report.error = String(error.stack || error); }
finally {
  try { if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); report.cleanup = 'passed'; }
  catch (error) { report.cleanup = 'failed'; report.cleanupError = String(error); report.status = 'failed'; }
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
process.stdout.write(`extras-browser: ${report.status}; ${join(output, 'report.json')}\n`);
if (report.error) process.stderr.write(report.error + '\n');
if (report.status !== 'passed') process.exitCode = 1;
