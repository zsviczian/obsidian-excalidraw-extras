import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(
  new URL('../../src/LatexTooltipPositioning.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const exports = {};
// Compile and execute only this checkout's trusted module, never vault content.
runInNewContext(outputText, { exports, Node: { ELEMENT_NODE: 1 } });

function documentFixture() {
  const observers = [];
  const tooltip = {
    style: {
      position: 'absolute',
      top: '-10000px',
      left: '0px',
      setProperty(key, value) {
        this[key] = value;
      },
    },
    classList: { contains: (name) => name === 'cm-tooltip-below' },
    querySelector: () => null,
    isConnected: true,
  };
  const doc = {
    defaultView: {
      CSS: { supports: () => true },
      MutationObserver: class {
        constructor(callback) {
          this.callback = callback;
          observers.push(this);
        }
        observe() {
          this.connected = true;
        }
        disconnect() {
          this.connected = false;
        }
      },
    },
    documentElement: {},
    querySelectorAll: () => [tooltip],
  };
  return { doc, tooltip, observers };
}

function pluginFixture(main, restored = []) {
  const listeners = new Map();
  const cleanups = [];
  let ready;
  const workspace = {
    containerEl: { ownerDocument: main.doc },
    on(name, callback) {
      listeners.set(name, callback);
      return { name, callback };
    },
    onLayoutReady(callback) {
      ready = callback;
    },
    iterateAllLeaves(callback) {
      for (const fixture of [main, ...restored, ...restored]) {
        callback({ getContainer: () => ({ doc: fixture.doc }) });
      }
    },
  };
  const plugin = {
    app: { workspace },
    registerEvent(ref) {
      cleanups.push(() => listeners.delete(ref.name));
    },
    register(dispose) {
      cleanups.push(dispose);
    },
  };
  exports.registerLatexTooltipPositioning(plugin);
  return {
    ready: () => ready(),
    emit: (name, fixture) => listeners.get(name)?.({ doc: fixture.doc }),
    unload: () => cleanups.forEach((dispose) => dispose()),
  };
}

test('positions previews in main, restored and newly opened windows without duplicate observers', () => {
  const main = documentFixture(),
    restored = documentFixture(),
    opened = documentFixture();
  const plugin = pluginFixture(main, [restored]);
  plugin.ready();
  plugin.emit('window-open', restored);
  plugin.emit('window-open', opened);
  for (const fixture of [main, restored, opened]) {
    assert.equal(fixture.tooltip.style.position, 'fixed');
    assert.equal(fixture.tooltip.style.top, 'anchor(bottom)');
    assert.equal(fixture.observers.length, 2);
    fixture.tooltip.style.top = '-10000px';
    fixture.observers[0].callback();
    assert.equal(fixture.tooltip.style.top, 'anchor(bottom)');
  }
  plugin.unload();
});

test('closing a popout disconnects only its observers; unload disconnects every remaining observer', () => {
  const main = documentFixture(),
    popout = documentFixture();
  const plugin = pluginFixture(main, [popout]);
  plugin.ready();
  plugin.emit('window-close', popout);
  assert.ok(popout.observers.every((observer) => !observer.connected));
  assert.ok(main.observers.every((observer) => observer.connected));
  plugin.unload();
  plugin.unload();
  assert.ok(main.observers.every((observer) => !observer.connected));
});

test('a deferred layout callback cannot install observers after plugin unload', () => {
  const main = documentFixture(),
    restored = documentFixture();
  const plugin = pluginFixture(main, [restored]);
  plugin.unload();
  plugin.ready();
  plugin.emit('window-open', restored);
  assert.equal(restored.observers.length, 0);
  assert.ok(main.observers.every((observer) => !observer.connected));
});
