# LaTeX preview validation

Use the dedicated `excalidraw-test` vault with Excalidraw, Extras and optionally
Latex Suite enabled. Never deploy a test build into a personal vault.

Build with `npm run build` (`npm.cmd run build` in Windows PowerShell). Copy only
the generated `dist/main.js`, `dist/styles.css` and `dist/manifest.json` to the
test vault's `.obsidian/plugins/excalidraw-extras/`, then reload Extras in that
vault. Preserve its `data.json` and other plugin settings.

Run `npm run test:latex-tooltip` for document registration and observer cleanup.
The tests cover restored and newly opened popouts, duplicate registration,
window close, plugin unload and a delayed layout callback after unload.

The sibling Excalidraw plugin provides a guarded native CLI gate:

```bash
npm run verify:obsidian:plugin -- --latex-preview
```

Run it from the plugin checkout after configuring its named test-vault paths;
see [the plugin runtime testing guide](https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/master/docs/OBSIDIAN_RUNTIME_TESTING.md).
It builds and deploys the main plugin, not Extras, so stage the matching Extras
build first. Extras MathJax-to-SVG and Latex Suite math previews must be enabled.
The gate checks real formulas, preview visibility, cursor input and save/reopen
in the main window, a new popout and a tab moved to a popout. The separate
`--latex-input` gate uses a renderer stub and does not validate Extras.

Manually check a popout that was already open when Extras was reloaded, a
restored popout, several simultaneous popouts, modal dragging and window close.
Reopening the dialog must still show its preview after another popout closes.
Record Windows and macOS results separately; desktop results do not establish
physical mobile behavior.

In the Windows Obsidian 1.14.0 test, native cursor input worked and tooltip
positioning was verified before and after the fix, including reload into an
already open popout. Latex Suite's preview independently failed on Temml's
untrusted `\class` markers. [Obsidian 1.14.1 replaces Temml with MathJax 4.1.3](https://obsidian.md/changelog/2026-09-08-desktop-v1.14.1/).
Update Obsidian, or clear Latex Suite's **Cursor symbol** and disable
**Highlight brackets in preview** as a temporary 1.14.0 workaround. Do not change
global renderer trust or inject a global MathJax to conceal this difference.

With both decorations temporarily disabled in memory, the Windows real-renderer
gate passed in the main window, a direct popout and a moved tab. Original Latex
Suite settings were restored and no settings file was changed. macOS and
physical mobile validation remain outstanding.

After upgrading to Obsidian 1.14.4, the same Windows real-renderer gate passed
in all three window cases with the original Latex Suite settings, including
cursor decorations. Preview rendering, JavaScript error checks and fixture
cleanup all passed without a workaround.
