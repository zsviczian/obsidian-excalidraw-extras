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
public api: ExcalidrawExtrasAPI = this.createAPI();

async onload(): Promise<void> {
await this.loadSettings();

if (this.settings.enableMathJaxToSVG) {
	initializeMathJaxToSVG();
}

if (this.settings.enableMermaidToExcalidraw) {
	initializeMermaidToExcalidraw();
}

if (this.settings.enablePDFExport) {
	initializePDFExport();
}

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

const candidate = mainPluginData as Partial<ExcalidrawExtrasSettings>;
if (typeof candidate.enableMathJaxToSVG === 'boolean') {
this.settings.enableMathJaxToSVG = candidate.enableMathJaxToSVG;
}

if (typeof candidate.enableMermaidToExcalidraw === 'boolean') {
this.settings.enableMermaidToExcalidraw =
	candidate.enableMermaidToExcalidraw;
}

if (typeof candidate.enablePDFExport === 'boolean') {
this.settings.enablePDFExport = candidate.enablePDFExport;
}

await this.saveSettings();
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
