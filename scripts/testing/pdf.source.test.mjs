/** IPC/DOM lifetime oracles only; genuine printed-PDF evidence belongs to the native lane. */
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { EventEmitter } from 'node:events';
import { sourceHarness } from './sourceHarness.mjs';
const graph = sourceHarness(); after(() => graph.close());
const { exportToPDF } = await graph.importModule('src/PDFExport/index.ts');
function documentFixture({ acknowledge = true, sendError = false } = {}) {
  const roots = [], timers = new Map(), requests = [], existingStyle = {}, ipcRenderer = new EventEmitter(); let timerId = 0;
  class Sheet { replaceSync(text) { this.text = text; } }
  const win = { CSSStyleSheet: Sheet, electron: { ipcRenderer }, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); } };
  const doc = { defaultView: win, adoptedStyleSheets: [existingStyle], body: { createDiv() {
    const root = { style: {}, children: [], appendChild(value) { this.children.push(value); }, remove() { roots.splice(roots.indexOf(this), 1); } }; roots.push(root); return root;
  } } };
  ipcRenderer.send = (channel, options) => { requests.push(options); if (sendError) throw Error('owned IPC failure'); if (acknowledge) queueMicrotask(() => ipcRenderer.emit(channel, {})); };
  const element = { ownerDocument: doc, cloneNode: () => ({ cloned: true }) };
  return { doc, win, roots, timers, requests, ipcRenderer, element, existingStyle };
}
function globals(t, fixture) {
  const before = Object.fromEntries(['document', 'window', 'CSSStyleSheet'].map(k => [k, globalThis[k]]));
  Object.assign(globalThis, { document: fixture.doc, window: fixture.win, CSSStyleSheet: fixture.win.CSSStyleSheet });
  t.after(() => Object.assign(globalThis, before));
}
const print = (element, pageSize = 'A4') => exportToPDF(element, 'owned-output.pdf', '#ffffff', pageSize, true, { top: 0.1, left: 0.2, right: 0.3, bottom: 0.4 }, false, '.owned{color:red}', '1-2');
function assertClean(f) { assert.equal(f.roots.length, 0); assert.deepEqual(f.doc.adoptedStyleSheets, [f.existingStyle]); assert.equal(f.ipcRenderer.listenerCount('print-to-pdf'), 0); assert.equal(f.timers.size, 0); }
test('PDF success preserves page options, clones content, and restores only owned resources', async t => {
  const f = documentFixture(); globals(t, f); await print(f.element);
  assert.equal(f.requests[0].filepath, 'owned-output.pdf'); assert.equal(f.requests[0].pageSize, 'A4'); assert.equal(f.requests[0].landscape, true); assert.equal(f.requests[0].open, false); assert.equal(f.requests[0].pageRanges, '1-2'); assertClean(f);
});
test('invalid page dimensions and clone errors cannot leave print DOM or adopted styles behind', async t => {
  const f = documentFixture(); globals(t, f);
  await assert.rejects(print(f.element, {}), /Invalid page dimensions/); assertClean(f);
  await assert.rejects(print({ ...f.element, cloneNode() { throw Error('owned clone failure'); } }), /clone failure/); assertClean(f);
});
test('IPC send failure removes the completion listener as well as DOM and styles', async t => {
  const f = documentFixture({ sendError: true }); globals(t, f);
  await assert.rejects(print(f.element), /IPC failure/); assertClean(f);
});
test('missing completion has a bounded deadline and late acknowledgement has no remaining listener', async t => {
  const f = documentFixture({ acknowledge: false }); globals(t, f);
  const pending = print(f.element); assert.equal(f.timers.size, 1, 'print completion must have a deadline');
  const rejected = assert.rejects(pending, /timed out/); [...f.timers.values()][0](); await rejected; assertClean(f);
  f.ipcRenderer.emit('print-to-pdf', {}); assertClean(f);
});
test('a popout print uses the content document and its Electron endpoint', async t => {
  const main = documentFixture(), popout = documentFixture(); globals(t, main);
  await print(popout.element); assert.equal(main.requests.length, 0); assert.equal(popout.requests.length, 1); assertClean(main); assertClean(popout);
});
test('missing Electron fails before allocating any print resources', async t => {
  const f = documentFixture(); delete f.win.electron; globals(t, f);
  await assert.rejects(print(f.element), /Electron|desktop/); assertClean(f);
});

test('IPC listener registration failure clears its deadline and print resources', async t => {
  const f = documentFixture(); globals(t, f);
  f.ipcRenderer.once = () => { throw Error('owned listener registration failure'); };
  await assert.rejects(print(f.element), /registration failure/); assertClean(f);
});
test('overlapping exports in one document reject without consuming the first completion', async t => {
  const f = documentFixture({ acknowledge: false }); globals(t, f);
  const first = print(f.element);
  const second = print(f.element);
  const observed = await Promise.race([second.then(() => 'resolved', error => String(error)), new Promise(resolve => setImmediate(() => resolve('pending')))]);
  assert.match(observed, /already in progress/);
  assert.equal(f.requests.length, 1); assert.equal(f.roots.length, 1);
  f.ipcRenderer.emit('print-to-pdf', {}); await first; assertClean(f);
  const retry = print(f.element); f.ipcRenderer.emit('print-to-pdf', {}); await retry; assertClean(f);
});
test('independent owning documents may print concurrently', async t => {
  const a = documentFixture({ acknowledge: false }), b = documentFixture({ acknowledge: false }); globals(t, a);
  const first = print(a.element), second = print(b.element);
  a.ipcRenderer.emit('print-to-pdf', {}); await first; assertClean(a);
  assert.equal(b.roots.length, 1); assert.equal(b.ipcRenderer.listenerCount('print-to-pdf'), 1);
  b.ipcRenderer.emit('print-to-pdf', {}); await second; assertClean(b);
});

test('print DOM allocation and append failures release styles and permit a later export', async t => {
  const f = documentFixture(); globals(t, f);
  const createDiv = f.doc.body.createDiv;
  f.doc.body.createDiv = () => { throw Error('owned print allocation failure'); };
  await assert.rejects(print(f.element), /allocation failure/); assertClean(f);
  f.doc.body.createDiv = () => { const root = createDiv(); root.appendChild = () => { throw Error('owned print append failure'); }; return root; };
  await assert.rejects(print(f.element), /append failure/); assertClean(f);
  f.doc.body.createDiv = createDiv;
  await print(f.element); assertClean(f);
});

test('non-Error IPC rejection remains an Error and releases the owning document', async t => {
  const f = documentFixture(); globals(t, f);
  f.ipcRenderer.send = () => { throw 'owned non-Error IPC failure'; };
  await assert.rejects(print(f.element), error => error instanceof Error && /owned non-Error/.test(error.message)); assertClean(f);
});
