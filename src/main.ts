import { Plugin } from 'obsidian';
import type { ExcalidrawExtrasAPI } from './api/ExcalidrawExtrasAPI';
import {
  getMathJaxVersion,
  tex2dataURL,
  clearMathJaxVariables,
} from './MathjaxToSVG';
import {
  getMermaidVersion,
  initializeMermaidToExcalidraw,
  parseMermaid,
} from './MermaidToExcalidraw';
import { exportToPDF, getPDFVersion, initializePDFExport } from './PDFExport';
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

    // API is instantiated here so the parent plugin can access it immediately
    this.api = this.createAPI();

    // Note: MathJax is lazily initialized inside tex2dataURL to keep load times near 0ms.

    if (this.settings.enableMermaidToExcalidraw) {
      initializeMermaidToExcalidraw();
    }

    if (this.settings.enablePDFExport) {
      initializePDFExport();
    }

    this.addSettingTab(new ExcalidrawExtrasSettingTab(this.app, this));
  }

  onunload(): void {
    clearMathJaxVariables();
  }

  public async migrateSettingsFromMainPlugin(
    mainPluginData: unknown,
  ): Promise<void> {
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
        tex2dataURL,
        clearMathJaxVariables
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