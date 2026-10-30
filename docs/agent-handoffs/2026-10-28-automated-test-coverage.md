# Automated test coverage: Extras owner

Prepared by **Zsolt's Codex Agent**, 2026-10-28, at the maintainer's request.

**Temporary design-only handoff. No tests or runtime behavior have been changed.** Read the complete design and acceptance criteria in the draft PR attached to this branch and its companion plugin/fork PRs. Continue on this branch and update that PR rather than opening a replacement.

## Baselines and instructions

- Branch: `2026-10-28-automated-test-coverage`, targeting `master`.
- Extras: `f82fe17c11f76f63163bfb5b2df430cbacd051d6`.
- Plugin: `962416bbd379b9c8aabf2a892940ef3abbf11185`.
- Fork: `9ede0da2581387b0bc12ef184a093a9274be9bb7`.
- Companion branches use the same branch name.

Read current `AGENTS.md` and `CONTRIBUTING.md` when present, then source and build configuration. `CONTRIBUTING.md` was absent at the investigated baseline. The generic AGENTS text mentions esbuild, but the actual `package.json` and `rollup.config.mjs` use Rollup and emit `dist/main.js`, `manifest.json` and `styles.css`; do not replace the build system to fit stale prose. Reconcile testing/build guidance during implementation.

## Ownership and starting checkpoint

Own behavioral tests for feature activation/timers/settings, MathJax initialization and rendering, Mermaid loading/conversion, PDF export, filesystem boundaries, LaTeX tooltip lifecycle, API declarations and the actual production bundle. Retain existing focused tests, but distinguish headless Mermaid SVG-fallback coverage from browser/native element conversion.

First reproduce the current independent test/build baseline and establish the shared artifact/report contract with the other two agents. Produce immutable hashes for the built Extras plugin and generated API declarations. The plugin owns the canonical portable test vault and native Obsidian orchestration. Register Extras scenarios with that coordinator instead of building a competing native runner or vault.

Native calls must exercise the real consumer route where caller checks apply. Never weaken production privilege gates merely to make a test call succeed. Stack-name caller recognition, including the existing iOS bypass, is not a cryptographic security boundary; document what the tests actually establish. Filesystem tests may read only newly created, owned temporary fixtures. Desktop PDF tests must inspect a real output file as well as cleanup; mocked IPC is not a print success.

Three agents may run independent suites in parallel, but all native staging/debugger/device-mode operations require the shared host lock. Disabled, absent and mobile-unavailable services are required test cases, not silent skips.

## Completion discipline

Implement all important Extras behaviors and real plugin integration, not only a skeleton suite. No package publication, version bump, merge, mobile PDF redesign or unrelated product refactor is authorized. Before final handoff, preserve durable testing instructions, remove this temporary file, update the PR with actual results and explicit limitations, and leave it draft for maintainer review. No build, test suite or Obsidian runtime validation was executed during design preparation.
