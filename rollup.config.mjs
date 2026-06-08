import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { builtinModules } from 'node:module';
import process from 'node:process';

const production = process.argv.includes('--configProduction');

export default {
	input: 'src/main.ts',
	output: {
		file: 'main.js',
		format: 'cjs',
		sourcemap: production ? false : 'inline',
	},
	external: ['obsidian', 'electron', ...builtinModules],
	plugins: [
		nodeResolve({ browser: true }),
		commonjs(),
		typescript({
			tsconfig: './tsconfig.json',
			compilerOptions: {
				inlineSourceMap: false,
				inlineSources: false,
				sourceMap: !production,
			},
		}),
		production ? terser() : undefined,
	],
};
