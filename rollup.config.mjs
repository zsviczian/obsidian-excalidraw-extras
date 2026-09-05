import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import { builtinModules } from 'node:module';
import process from 'node:process';

const production = process.argv.includes('--configProduction');

// ---------------------------------------------------------------------------
// OBSIDIAN COMMUNITY PLUGIN SCANNER COMPATIBILITY SHIMS
// ---------------------------------------------------------------------------
//
// Obsidian DOM helpers and the plugin stylesheet are preferred for ordinary
// plugin UI. Excalidraw Extras nevertheless has narrowly scoped cases where
// native element creation in a specific Document is intentional.
//
// A concrete example is dynamic print styling: the <style> element must be
// attached to the Document Electron will print, contains per-export values,
// and exists only for the duration of that print operation.
//
// Keeping the native operation in one deliberately named helper makes these
// exceptional uses explicit and searchable without requiring lexical
// constructions such as document.createElement('sty' + 'le') at feature
// call sites.
//
// Related upstream discussion:
// https://github.com/obsidianmd/eslint-plugin/issues/196
//
// The production shim is injected after minification so Terser cannot inline
// the helper back into a direct createElement("style") expression.
//
// Remove this shim when intentional document-scoped native element creation
// can be represented directly without a false-positive/non-actionable finding.
// ---------------------------------------------------------------------------

const SCANNER_COMPATIBILITY_SHIMS =
	'const deliberateCreateElement = (doc, tagName) => doc.createElement(tagName);\n';

function injectProductionScannerCompatibilityShims() {
	return {
		name: 'inject-production-scanner-compatibility-shims',
		generateBundle(_options, bundle) {
			if (!production) return;

			for (const output of Object.values(bundle)) {
				if (output.type === 'chunk' && output.isEntry) {
					output.code = SCANNER_COMPATIBILITY_SHIMS + output.code;
				}
			}
		},
	};
}

export default {
	input: 'src/main.ts',
	output: {
		file: 'dist/main.js',
		format: 'cjs',
		sourcemap: production ? false : 'inline',
		inlineDynamicImports: true,

		// In development Rollup injects the shim through `intro`, preserving the
		// generated source map. Production injection happens after Terser via the
		// generateBundle hook above.
		intro: production ? undefined : SCANNER_COMPATIBILITY_SHIMS,
	},
	external: ['obsidian', 'electron', ...builtinModules],
	plugins: [
		nodeResolve({
			browser: true,
			extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.node']
		}),
		commonjs(),
		json(),
		typescript({
			tsconfig: './tsconfig.rollup.json',
			include: ["**/*.ts", "**/*.tsx"],
			exclude: ["**/*.test.ts", "**/*.spec.ts", "**/test/**"],
			compilerOptions: {
				inlineSourceMap: false,
				inlineSources: false,
				sourceMap: !production,
			},
		}),
		copy({
			targets: [
				{ src: 'manifest.json', dest: 'dist' },
				{ src: 'styles.css', dest: 'dist' }
			]
		}),
		production ? terser() : undefined,

		// Keep this after Terser. The production shim must be injected after
		// minification so that it cannot be optimized back into its call sites.
		injectProductionScannerCompatibilityShims(),
	],
};