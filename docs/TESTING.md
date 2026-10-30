# Extras testing

## Fork PR #478: offline per-diagram loading

Converter 3.1.0 is bundled with every Pele lazy diagram module into the single
runtime file. The unreleased Mermaid service contract stays 3.0.0; it is not the
converter's package version. No package/API release bump is included.
`npm run test:browser` now checks twelve diagram kinds, editable labels, decoded
SVG pixels, syntax/limit errors and recovery, with no runtime chunks served and
all remote requests rejected. The sibling plugin's native gateway repeats the
twelve-kind conversion offline with normalized geometry assertions. Full portable
and native checks remain required; see the fork's PR #478 review for results.

Final PR #478 portable verification passes 701 combined cases, including 29
Extras source and 17 built-browser cases. A real-Extras main/popout diagnostic
passes 43 assertions across 13 diagram kinds, editing/export/save-reopen and
cleanup. The full native observer settling gate fails on both the candidate and
a fresh pre-merge renderer; it remains a failure, with no production observer or
diagnostic-policy change. See the fork's `dev-docs/Obsidian/pr-478-results.json`.

## Current acceptance checkpoint - 2026-10-30

At Extras `1cdcb7c425a9b80afdc7b39c88861143b4b85e58`, fork
`053a3b9f9e77917c457fce8ca9453d38b92a303b` and plugin
`fd32ac682e2aadc0f982fa23d36da482011117f9`, both complete native repeats pass
**357/357 required cases**, including all 258 behavioral obligations and 40
device/layout profiles. Artifact hashes match; cleanup, baseline restoration and
both negative controls pass. Final portable validation passes 666 canonical
cases, including **29 Extras source cases (2 new / 27 reused)** and **four reused
built-browser cases**, plus API/package/build gates. Fast/source lanes overlap
and are not added together.

Each repeat performs one real plugin-to-Extras PDF export and verifies one
288 x 216 pt page, expected text, 3330 red pixels and restored print resources.
The final rendered page was visually inspected and its hash matches the earlier
decoded output. Product waiting remains completion-driven: the 120000 ms timeout
and per-document concurrency rejection stay removed, with no replacement lock,
queue or cancellation. Deterministic delayed-completion coverage beyond two
minutes and bounded tooling deadlines preserving unsettled native work remain.

The native entry is `npm.cmd run test:native` from the plugin checkout, repeated
with fixed revisions and fresh reports. It freshly builds/deploys/hash-verifies
workspace artifacts and automatically configures/enables the services in
`.test-work/vaults/excalidraw-auto-test/`. See the
[complete sanitized evidence and commands](https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/2026-10-28-automated-test-coverage/docs/testing-evidence/3022/README.md).
No production, API, dependency or version change accompanies this completion.
The historical sustained observer cause remains unproven; current strict gates
pass, with no exception waiver. Physical devices, other native OSes, real OS
drag/clipboard and isolated whole-app cold start remain separate evidence.

The independent Node runner discovers every `scripts/testing/*.test.mjs` file and rejects zero discovery or duplicate IDs. Tests compile actual whole TypeScript modules through a test-only source graph. Structural Obsidian/IPC boundaries make service activation, settings UI callbacks, filesystem errors and PDF resource ownership deterministic; they do not establish rendered output. Pinned c8 remaps executed modules, lists unexecuted runtime modules and type-only exclusions, and enforces reviewed per-module thresholds in `tests/coverage-ratchets.json`. Fast and source reports describe overlapping tests and must not be added together as independent cases.

The built-browser lane evaluates actual `dist/main.js` with a minimal Obsidian host adapter. It runs real MathJax and Mermaid offline, decodes their SVG into canvas pixels, checks editable flowchart structure, strict-error recovery, disabled services, missing Electron and old API references after unload. Browser error and external-request counts must be zero. Playwright is development-only and pinned; Chromium version and bundle hash are recorded in the report. These tests do not claim native Obsidian UI or genuine PDF printing.

The package lane packs the generated API, installs it into a clean consumer and typechecks service calls plus a negative invalid-component assertion. Packing does not publish. It verifies declared consumer resolution instead of reading source interfaces directly. Dependencies may need network setup. The test records tarball integrity and leaves diagnostic files in its unique ignored directory.

The plugin repository owns serial native integration in an explicitly authorized disposable vault under the application-session lock. Its Extras contribution exercises the actual plugin gateway, MathJax decode, editable Mermaid and an Electron-produced PDF; PDF.js verifies page geometry, source text and rendered SVG pixels. The coordinator stages immutable manifests containing all three source identities and byte hashes. Workspace and published-package evidence remain distinct. Native PDF, physical Android/iOS, legacy Obsidian and other operating systems are separate evidence; a browser capability rejection is not a PDF pass.

## Checkpoint, 2026-10-28

The initial Windows checkpoint had 30 source cases, four built-browser cases and passing package/coverage gates. The maintainer subsequently requested a targeted rollback of the PDF timeout and per-document concurrency rejection. Both are removed; PDF export waits for the real Electron completion response. No replacement deadline, queue, lock or cancellation is introduced in the product.

The updated deterministic PDF regression advances its controlled clock beyond two minutes and again by fifteen minutes. The export must remain pending with the same print root, stylesheet and completion listener until acknowledgement; normal completion then releases those resources. Dimension validation, owner-document/window handling, IPC/DOM failure cleanup and activation/unload fixes remain covered and unchanged. Concurrency is not a native acceptance experiment.

The plugin coordinator keeps bounded test deadlines. A failed tooling deadline cannot cancel Electron printing: unsettled work and its exact resources/controller must remain available for guarded recovery. The maintained tooling negative control verifies that distinction. Native verification runs one real plugin-gateway export and retains the PDF and rendered page beside its report. Current native completion/output evidence belongs to the expanded plugin run, not this historical checkpoint.

These fixes have failed-before/passed-after evidence; no package version, runtime dependency or public API signature changes. Initial browser decode/export-shape assumptions, an unavailable offline npm cache and source-coverage reporting failures remain in ignored diagnostic logs rather than being represented as successful first attempts. Full cross-repository acceptance is owned by the coordination PR; its current completed checkpoint is recorded above.

When adding a service or changing a boundary, update source tests, the browser/native scenario as applicable, generated API consumer, coverage ratchets and plugin feature registry. Add success, rejection and cleanup oracles; exact source/bundle/fixture identities belong in run artifacts. Keep tests and instrumentation outside the shipped bundle.
