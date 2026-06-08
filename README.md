# Excalidraw Extras for Obsidian

**Excalidraw Extras** is a companion plugin for the [Obsidian Excalidraw Plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin). 

It is designed to house heavy dependencies and high-privilege operations, cleanly separating them from the core drawing experience. This architectural split ensures the main Excalidraw plugin remains lightweight, loads incredibly fast, works seamlessly with strict constraints like Obsidian Sync Basic, and complies with Obsidian's community security policies.

⚠️ **Note:** This plugin does nothing on its own. It is an extension package that the main Excalidraw plugin hooks into. 

## Full Disclosure: What is in this plugin?

To comply with Obsidian's security guidelines and provide total transparency to users, here is a complete breakdown of what code has been carved out of the main plugin and moved into Excalidraw Extras:

### 📦 Large Packages
These packages significantly increase bundle size and are separated here so users who don't need them don't have to load them:
- **MathjaxToSVG**: The engine that parses LaTeX formulas into SVG elements.
- **MermaidToExcalidraw**: The engine that converts Mermaid code blocks into visual Excalidraw elements.

### 🛡️ High-Privilege Operations
Because Obsidian acts as a local Markdown editor, certain advanced features require access to your operating system. These have been moved here so you can explicitly opt-in:
- **File System (`fs`) Access**: Advanced file operations beyond Obsidian's standard vault API.
- **Network Access**: Outbound requests required for specific external integrations or advanced rendering features.
- **IPC Calls (Inter-Process Communication)**: Advanced Electron/Node capabilities, primarily utilized for **PDF Printing** and export functions.

*Note: Code evaluation functions (`eval`) and `btoa` encoding logic required for the delayed, high-performance loading of the core Excalidraw canvas remain in the core plugin and have **not** been moved here.*

## Installation & Usage

1. Install the main [Obsidian Excalidraw Plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin).
2. Install **Excalidraw Extras** from the Obsidian Community Plugins browser.
3. Enable both plugins.

When the main Excalidraw plugin needs to render a LaTeX equation, parse a Mermaid diagram, or export a PDF, it will automatically detect this Extras package, verify its version, and execute the task. 

If this plugin is missing, the main plugin will simply prompt you to install it when you try to use one of the features listed above.

## For Developers

The main Excalidraw plugin interacts with this plugin via an exposed, strictly typed API. We publish these types to NPM so other plugins (or the parent plugin) can interact with the Extras package without bundling its heavy logic.

```typescript
// Example of how the parent plugin interfaces with Extras
const extras = app.plugins.plugins['obsidian-excalidraw-extras'];
if (extras && extras.api) {
    const svg = await extras.api.mathjax.tex2SVG("E=mc^2");
}
```

For more details on contributing or how the inter-plugin communication works, please see [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).