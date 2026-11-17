# Contributing

Use Node 22.22.3 and npm. Install with `npm ci`; runtime dependencies remain bundled, and only Obsidian is external. Source tests need `module.registerHooks` (Node 22.15+). The production build uses Rollup, not the generic sample-plugin esbuild workflow.

Run `npm run test:fast`, `npm run test:source`, `npm run build`, `npm run build:api`, `npm run test:package`, and `npm run test:browser`. Install the pinned Chromium once with `npx playwright install chromium` (Linux CI also needs `--with-deps`). Set `PLAYWRIGHT_BROWSERS_PATH` to reuse an explicitly selected cache. Reports live under ignored `.test-work/reports`; `EXCALIDRAW_TEST_REPORT_DIR` selects an output directory. Package consumers use unique ignored directories and may download ordinary npm dependencies on first setup; renderer scenarios block remote resources.

Run `npm run lint` and compare diagnostics with the baseline. Add behavioral regression evidence before fixing a defect; do not loosen assertions or silently update goldens. Preserve settings unknown keys, service activation semantics, public API signatures and mobile capability checks. The stack-name caller check is a diagnostic heuristic, not authentication.

See [the testing guide](docs/TESTING.md) for evidence boundaries and native integration. Version bumps, publishing and merges require maintainer instructions. Do not commit generated `dist/`, `api/`, browser downloads or test work directories.

## API package dependencies

The repository builds both the Extras plugin and the separately published
`@zsviczian/excalidraw-extras-api` declarations. MathJax and the direct Nano ID
dependency belong in `devDependencies`: Rollup still bundles their imported code
into the Extras plugin, but installing the API package does not install them.
The converter remains a consumer dependency because the public declarations
reference its types. Converter 3.6.0 uses Pele instead of the Mermaid package;
making the declarations fully self-contained is a separate change.

After changing dependencies, run the production/API builds, packed consumer test
and offline browser renderer tests. The consumer test checks that installing the
tarball excludes MathJax, speech-rule-engine, Mermaid and DOMPurify. Nano ID can
still be installed transitively through the converter. Browser tests verify that
the built Extras plugin still renders equations and diagrams offline.

The npm API version is independent of the Obsidian plugin manifest version.
Prepare an API-only version by editing `package.json` and updating the lockfile;
do not use `npm version` for this, since its version hook also changes the plugin
manifest and `versions.json`. Publish from this repository only after maintainer
approval, then update API consumers to the newly published package.
