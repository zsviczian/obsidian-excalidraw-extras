import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import { builtinModules } from 'node:module';
import process from 'node:process';

const production = process.argv.includes('--configProduction');

export default {
	input: 'src/main.ts',
	output: {
		file: 'dist/main.js',
		format: 'cjs',
		sourcemap: production ? false : 'inline',
		inlineDynamicImports: true, 
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
	],
};