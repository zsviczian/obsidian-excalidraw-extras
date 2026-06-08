# Contributing to Excalidraw Extras

Thank you for your interest in contributing! 

Before you dive in, please note that this is a **companion plugin** to the main [Obsidian Excalidraw Plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin). 

## Where should I contribute?

Because the architecture of Excalidraw in Obsidian is split into multiple parts, it's important to know where your contribution belongs:

1. **This Repository (`obsidian-excalidraw-extras`)**: 
   - LaTeX/MathJax rendering fixes (`MathjaxToSVG`).
   - Mermaid parsing logic (`MermaidToExcalidraw`).
   - PDF printing, high-privilege File System (fs) access, Network access, or IPC logic.
2. **The Parent Plugin (`obsidian-excalidraw-plugin`)**:
   - UI/UX of the Obsidian plugin, Settings tabs, ExcalidrawAutomate (EA), Markdown parsing, and file management.
3. **The Core Excalidraw Library (`zsviczian/excalidraw`)**:
   - Core drawing tools, canvas interactions, shape rendering, and React components.

*Note: For most feature requests and visual bugs, you will likely need to contribute to the parent project or the core library.*

## Local Development Setup

1. Clone this repository into your Obsidian vault's plugin folder:
   `[vault]/.obsidian/plugins/obsidian-excalidraw-extras/`
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start Rollup in watch mode.
4. Reload the plugin in Obsidian to see your changes.

## Modifying the API

This plugin exposes its API for the main plugin to consume. If you are adding a new high-privilege feature or updating a library:
1. Update the interface in `src/api/ExcalidrawExtrasAPI.ts`.
2. Ensure you bump the specific component version in the API so the main plugin can gracefully fall back if users have mismatched plugin versions.
3. Keep in mind that changes to the API might require a companion Pull Request in the [parent repository](https://github.com/zsviczian/obsidian-excalidraw-plugin) to actually utilize your new code.

## Submitting a Pull Request
- Create a feature branch.
- Clearly describe the problem and your solution.
- If your change affects how the main plugin interacts with this one, please state that in the PR description.