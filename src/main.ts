import { Plugin } from 'obsidian';
import type { ExcalidrawExtrasAPI } from './api';
import {
getMathJaxVersion,
initializeMathJaxToSVG,
tex2SVG,
} from './MathjaxToSVG';
import {
getMermaidVersion,
initializeMermaidToExcalidraw,
parseMermaid,
} from './MermaidToExcalidraw';
import {
exportToPDF,
getPDFVersion,
initializePDFExport,
} from './PDFExport';
import {
DEFAULT_SETTINGS,
ExcalidrawExtrasSettingTab,
ExcalidrawExtrasSettings,
} from './settings';

export default class ExcalidrawExtrasPlugin extends Plugin {
public settings: ExcalidrawExtrasSettings = DEFAULT_SETTINGS;
public api!: ExcalidrawExtrasAPI;

async onload(): Promise<void> {
await this.loadSettings();

initializeMathJaxToSVG();
initializeMermaidToExcalidraw();
initializePDFExport();

this.api = this.createAPI();
this.addSettingTab(new ExcalidrawExtrasSettingTab(this.app, this));
}

onunload(): void {
// Reserved for future teardown logic.
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- migration payload is not stabilized yet.
public async migrateSettingsFromMainPlugin(mainPluginData: any): Promise<void> {
if (!mainPluginData || typeof mainPluginData !== 'object') {
return;
}

// Settings migration from obsidian-excalidraw-plugin will be implemented incrementally.
}

public async loadSettings(): Promise<void> {
this.settings = Object.assign(
{},
DEFAULT_SETTINGS,
(await this.loadData()) as Partial<ExcalidrawExtrasSettings>,
);
}

public async saveSettings(): Promise<void> {
await this.saveData(this.settings);
}

private createAPI(): ExcalidrawExtrasAPI {
return {
versions: {
mathjax: getMathJaxVersion(),
mermaid: getMermaidVersion(),
pdf: getPDFVersion(),
},
mathjax: {
tex2SVG,
},
mermaid: {
parseMermaid,
},
pdf: {
exportToPDF,
},
};
}
}
