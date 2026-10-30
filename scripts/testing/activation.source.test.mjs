import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceHarness } from './sourceHarness.mjs';

async function setup(t, { persisted = {}, mathFailure = false } = {}) {
  const originalWindow = globalThis.window, timers = new Map(), notices = [], calls = [], state = { mathFailure }; let timerId = 0;
  globalThis.window = { setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimeout(id) { timers.delete(id); } };
  class Plugin {
    app = {}; writes = []; cleanups = [];
    async loadData() { return persisted; }
    async saveData(data) { this.writes.push(structuredClone(data)); }
    addSettingTab() {}
    register(callback) { this.cleanups.push(callback); }
  }
  class PluginSettingTab { constructor(app, plugin) { this.app = app; this.plugin = plugin; } }
  class InitializationError extends Error { originalError = Error('owned initialization fault'); }
  const graph = sourceHarness({
    obsidian: { Plugin, App: class {}, Notice: class { constructor(message) { notices.push(message); } }, Platform: { isIosApp: false }, PluginSettingTab, Setting: class {} },
    './MathjaxToSVG': { getMathJaxVersion: () => '1.1.1', tex2dataURL: async () => { calls.push('mathjax'); return { dataURL: 'fixture' }; }, clearMathJaxVariables() { calls.push('clear-mathjax'); }, initializeMathJaxRenderer() { if (state.mathFailure) throw new InitializationError('failed'); }, MathJaxInitializationError: InitializationError },
    './MermaidToExcalidraw': { getMermaidVersion: () => '3.0.0', getModule: async () => { calls.push('mermaid'); return { loaded: true }; } },
    './PDFExport': { getPDFVersion: () => '1.0.0', initializePDFExport() {}, exportToPDF: async () => calls.push('pdf') },
    './FileSystem': { getFileSystemVersion: () => '1.0.0', readLocalFile: async () => { calls.push('filesystem'); return 'owned'; }, readLocalFileBinary: async () => new ArrayBuffer(2) },
    './LatexTooltipPositioning': { registerLatexTooltipPositioning() {} },
  });
  const { default: Extras } = await graph.importModule('src/main.ts');
  const plugin = new Extras();
  const errors = [], originalError = console.error; console.error = (...args) => errors.push(args);
  t.after(() => { plugin.onunload(); graph.close(); globalThis.window = originalWindow; console.error = originalError;
    assert.equal(errors.length, mathFailure ? 1 : 0, 'Unexpected initialization errors');
    if (mathFailure) assert.match(String(errors[0][1]), /owned initialization fault/);
  });
  await plugin.onload();
  return { plugin, timers, notices, calls, state };
}
const setting = { mathjax: 'enableMathJaxToSVG', mermaid: 'enableMermaidToExcalidraw', pdf: 'enablePDFExport', filesystem: 'enableFileSystem' };
test('all service gates reject disabled operations and permanent activation persists only the chosen setting', async t => {
  const { plugin, calls } = await setup(t, { persisted: Object.fromEntries(Object.values(setting).map(key => [key, false])) });
  assert.equal(await plugin.api.mathjax.tex2dataURL('x'), null);
  await assert.rejects(plugin.api.mermaid.getModule(), /disabled/);
  await assert.rejects(plugin.api.pdf.exportToPDF(), /disabled/);
  await assert.rejects(plugin.api.filesystem.readLocalFile('owned', {}), /disabled/);
  assert.deepEqual(calls, []);
  for (const [component, key] of Object.entries(setting)) {
    await plugin.api.features.enable(component); assert.equal(plugin.settings[key], true); assert.equal(plugin.api.features.isActive(component), true);
    await plugin.api.features.disable(component); assert.equal(plugin.settings[key], false);
  }
  assert.equal(plugin.writes.length, 8);
});
test('session and timed activation replace timers without writing permanent preferences', async t => {
  const { plugin, timers } = await setup(t, { persisted: { enableMermaidToExcalidraw: false } });
  await plugin.api.features.enable('mermaid', 2); assert.equal(timers.size, 1); assert.equal(plugin.writes.length, 0);
  await plugin.api.features.enable('mermaid', 3); assert.equal(timers.size, 1); assert.equal([...timers.values()][0].delay, 180000);
  await plugin.api.features.enable('mermaid', -1); assert.equal(timers.size, 0); assert.equal(plugin.api.features.isActive('mermaid'), true);
  assert.equal(plugin.settings.enableMermaidToExcalidraw, false); assert.equal(plugin.writes.length, 0);
});
test('temporary expiry restores the permanent preference rather than disabling a permanent feature', async t => {
  const { plugin, timers } = await setup(t, { persisted: { enableMermaidToExcalidraw: true } });
  await plugin.api.features.enable('mermaid', 1); await [...timers.values()][0].fn(); await Promise.resolve();
  assert.equal(plugin.settings.enableMermaidToExcalidraw, true);
  assert.equal(plugin.api.features.isActive('mermaid'), true); assert.equal(plugin.writes.length, 0); assert.equal(timers.size, 0);
});
test('unload clears temporary state and old API references cannot reactivate a service', async t => {
  const { plugin, timers } = await setup(t, { persisted: { enableMermaidToExcalidraw: false } });
  await plugin.api.features.enable('mermaid', -1); await plugin.api.features.enable('pdf', 1);
  plugin.onunload(); assert.equal(timers.size, 0); assert.equal(plugin.api.features.isActive('mermaid'), false);
  await assert.rejects(plugin.api.features.enable('mermaid'), /unloaded/);
});
test('MathJax initialization failure is contained and explicit activation can retry', async t => {
  const { plugin, state, notices } = await setup(t, { mathFailure: true });
  assert.equal(plugin.api.features.isActive('mathjax'), false);
  assert.equal(plugin.api.features.isActive('mermaid'), true);
  assert.equal(await plugin.api.mathjax.tex2dataURL('x'), null);
  state.mathFailure = false; await plugin.api.features.enable('mathjax', -1);
  assert.equal(plugin.api.features.isActive('mathjax'), true); assert.equal(notices.length, 1);
});
test('unknown settings survive migration and only recognized boolean legacy flags are adopted', async t => {
  const { plugin } = await setup(t, { persisted: { futureSetting: { retained: true } } });
  await plugin.migrateSettingsFromMainPlugin({ enableMermaidToExcalidraw: false, enablePDFExport: 'invalid' });
  assert.deepEqual(plugin.settings.futureSetting, { retained: true }); assert.equal(plugin.settings.enableMermaidToExcalidraw, false); assert.equal(plugin.settings.enablePDFExport, true);
});
