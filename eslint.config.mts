import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import js from '@eslint/js';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
	globalIgnores([
		'node_modules',
        '.test-work',
		'dist',
		'esbuild.config.mjs',
		'rollup.config.mjs',
		'version-bump.mjs',
		'versions.json',
		'main.js',
		'package.json',
		'package-lock.json',
		'tsconfig.json',
		'tsconfig.api.json',
		'api',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
	},
	// The Obsidian rules require typed plugin source, not Node's test harness.
	...obsidianmd.configs.recommended.map((config) => ({
		...config,
		ignores: [...(config.ignores ?? []), 'scripts/testing/**/*.mjs'],
	})),
	{
		files: ['scripts/testing/**/*.mjs'],
		languageOptions: { globals: globals.node },
		rules: js.configs.recommended.rules,
	},
);
