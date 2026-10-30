import {sourceIdentity} from './provenance.mjs';
/** Independent Node discovery and source-mapped coverage; no coordinator checkout required. */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyCoverageRatchets } from './coverageGate.mjs';
import { writeReportFiles } from './reportFiles.mjs';
import { productionModules } from './sourceInventory.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'), coverage = process.argv.includes('--coverage');
const output = resolve(process.env.EXCALIDRAW_TEST_REPORT_DIR || join(root, `.test-work/reports/${coverage ? 'coverage' : 'fast'}`));
mkdirSync(output, { recursive: true });
const files = readdirSync(join(root, 'scripts/testing')).filter(file => file.endsWith('.test.mjs')).sort().map(file => 'scripts/testing/' + file);
if (!files.length) throw Error('Zero discovered Extras tests');
const reportPath = join(output, 'report.json');
const args = ['--experimental-transform-types', '--enable-source-maps', '--test', '--test-concurrency=4', '--test-reporter=dot', '--test-reporter=./scripts/testing/reporter.mjs', '--test-reporter-destination=stdout', '--test-reporter-destination=' + reportPath, ...files];
const invocation = coverage ? [join(root, 'node_modules/c8/bin/c8.js'), '--exclude-after-remap', '--include=src/**', '--exclude=src/**/*.d.ts',
  '--reporter=json', '--reporter=json-summary', '--reporter=lcov', '--reporter=html', '--reports-dir=' + join(output, 'source'), '--temp-directory=' + join(output, 'raw-' + randomUUID()), process.execPath, ...args] : args;
const result = spawnSync(process.execPath, invocation, { cwd: root, env: { ...process.env, EXCALIDRAW_TEST_SUITE_ID: coverage ? 'extras-source' : 'extras-fast' }, stdio: 'inherit', windowsHide: true, timeout: 300000 });
if (result.error) throw result.error;
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
report.source = sourceIdentity(root);
report.discovery = { files, excludedFromSourceCoverage: [] };
const executed = new Set(report.tests.map(test => test.sourcePath));
if (files.some(file => !executed.has(file)) || new Set(report.tests.map(test => test.testId)).size !== report.tests.length) { report.status = 'failed'; report.error = 'Missing or duplicate test discovery'; }
if (coverage) {
  const summary = JSON.parse(readFileSync(join(output, 'source/coverage-summary.json'), 'utf8'));
  report.coverage = { engine: 'c8', version: JSON.parse(readFileSync(join(root, 'node_modules/c8/package.json'), 'utf8')).version, totals: summary.total,
    files: Object.entries(summary).filter(([path]) => path !== 'total').map(([path, value]) => ({ path: relative(root, path).replaceAll('\\', '/'),
      coveredLinePercent: value.lines.pct, coveredBranchPercent: value.branches.pct, coveredFunctionPercent: value.functions.pct })) };
  const modules = productionModules(root);
  report.excludedTypeOnlyModules = modules.typeOnly;
  report.unexecutedProductionModules = modules.runtime.filter(path => !report.coverage.files.some(file => file.path === path));
  report.coverageLimitations = 'Only executed whole modules count. Real MathJax/Mermaid browser rendering and Electron PDF pixels are separate evidence.';
  try { verifyCoverageRatchets(report.coverage, JSON.parse(readFileSync(join(root, 'tests/coverage-ratchets.json'), 'utf8'))); report.coverageGate = 'passed'; }
  catch (error) { report.coverageGate = 'failed'; report.status = 'failed'; report.error = error.message; }
}
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n'); writeReportFiles(report, output);
process.stdout.write(`\n${report.tests.length} Extras tests: ${report.status}; ${reportPath}\n`);
if (report.error) process.stderr.write(report.error + '\n');
process.exitCode = result.status || (report.status === 'passed' ? 0 : 1);
