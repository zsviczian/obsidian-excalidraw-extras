import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sourceHarness } from './sourceHarness.mjs';
const graph = sourceHarness(); after(() => graph.close());
const { readLocalFile, readLocalFileBinary } = await graph.importModule('src/FileSystem/index.ts');
const { getPageSize } = await graph.importModule('src/PDFExport/pdfExportUtils.ts');

test('actual filesystem reads owned UTF-8 and binary files with spaces/Unicode and exact byte ranges', async t => {
  const root = fs.mkdtempSync(join(tmpdir(), 'excalidraw-extras-fs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const text = join(root, 'owned \u00c1rv\u00edzt\u0171r\u0151 \u6d4b\u8bd5.txt'), binary = join(root, 'owned bytes.bin');
  fs.writeFileSync(text, 'UTF-8 \u00e1\u00e9 \u6d4b\u8bd5'); fs.writeFileSync(binary, new Uint8Array([0, 128, 255]));
  const app = { vault: { adapter: { fs } } };
  assert.equal(await readLocalFile(text, app), 'UTF-8 \u00e1\u00e9 \u6d4b\u8bd5');
  assert.deepEqual([...new Uint8Array(await readLocalFileBinary(encodeURI(binary), app))], [0, 128, 255]);
  await assert.rejects(readLocalFile(join(root, 'missing'), app), /File Read Error/);
});
test('binary subviews never expose surrounding bytes from a shared buffer', async () => {
  const backing = new Uint8Array([99, 1, 2, 3, 88]), view = backing.subarray(1, 4);
  const app = { vault: { adapter: { fs: { readFile(_path, callback) { callback(null, view); } } } } };
  const result = await readLocalFileBinary('owned', app); assert.equal(result.byteLength, 3); assert.deepEqual([...new Uint8Array(result)], [1, 2, 3]);
  backing[1] = 77; assert.equal(new Uint8Array(result)[0], 1);
});
test('unavailable capability, malformed encoding, callback failures and invalid data reject explicitly', async () => {
  const unavailable = { vault: { adapter: {} } };
  await assert.rejects(readLocalFile('owned', unavailable), /not available/);
  await assert.rejects(readLocalFileBinary('owned', unavailable), /not available/);
  await assert.rejects(readLocalFileBinary('%broken', unavailable), URIError);
  for (const error of [Error('EACCES'), 'permission denied', { code: 'failure' }]) {
    const app = { vault: { adapter: { fs: { readFile(_path, encoding, callback) { (callback || encoding)(error); } } } } };
    await assert.rejects(readLocalFile('owned', app), /File Read Error/); await assert.rejects(readLocalFileBinary('owned', app), /File Read Error/);
  }
  for (const data of [null, 'not binary', {}, 42]) {
    await assert.rejects(readLocalFileBinary('owned', { vault: { adapter: { fs: { readFile(_path, callback) { callback(null, data); } } } } }), /Unexpected binary data type/);
  }
});
test('PDF named sizes and custom pixel dimensions retain the documented 96-DPI conversion', () => {
  for (const size of ['A4', 'Letter', 'Legal']) assert.equal(getPageSize(size), size);
  assert.deepEqual(getPageSize({ width: 960, height: 480 }), { width: 10, height: 5 });
  for (const input of [null, {}, { width: 'bad', height: 1 }, ...[NaN, Infinity, -1, 0].flatMap(value => [{ width: value, height: 1 }, { width: 1, height: value }])]) assert.throws(() => getPageSize(input), /Invalid page dimensions/);
});
