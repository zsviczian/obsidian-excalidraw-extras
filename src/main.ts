import { Plugin } from 'obsidian';
import type {
  ExcalidrawExtrasAPI,
  ExtrasComponent,
} from './api/ExcalidrawExtrasAPI';
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
  private temporaryOverrides: Record<string, boolean> = {};

  async onload(): Promise<void> {
    await this.loadSettings();
    this.api = this.createAPI();

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
    if (!mainPluginData || typeof mainPluginData !== 'object') return;

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
      features: {
        isActive: (component: ExtrasComponent) => {
          if (this.temporaryOverrides[component]) return true;
          switch (component) {
            case 'mathjax':
              return this.settings.enableMathJaxToSVG;
            case 'mermaid':
              return this.settings.enableMermaidToExcalidraw;
            case 'pdf':
              return this.settings.enablePDFExport;
            default:
              return false;
          }
        },
        enable: async (component: ExtrasComponent, temporary = false) => {
          if (temporary) {
            this.temporaryOverrides[component] = true;
          } else {
            switch (component) {
              case 'mathjax':
                this.settings.enableMathJaxToSVG = true;
                break;
              case 'mermaid':
                this.settings.enableMermaidToExcalidraw = true;
                break;
              case 'pdf':
                this.settings.enablePDFExport = true;
                break;
            }
            await this.saveSettings();
          }
        },
        disable: async (component: ExtrasComponent) => {
          this.temporaryOverrides[component] = false;
          switch (component) {
            case 'mathjax':
              this.settings.enableMathJaxToSVG = false;
              break;
            case 'mermaid':
              this.settings.enableMermaidToExcalidraw = false;
              break;
            case 'pdf':
              this.settings.enablePDFExport = false;
              break;
          }
          await this.saveSettings();
        },
      },
      mathjax: {
        tex2dataURL: async (...args) => {
          // Strictly enforce settings at the function execution level
          if (!this.api.features.isActive('mathjax')) return null;
          return tex2dataURL(...args);
        },
        clearMathJaxVariables,
      },
      mermaid: { parseMermaid },
      pdf: {
        exportToPDF: async (...args) => {
          if (!this.api.features.isActive('pdf')) {
            throw new Error('PDF export feature is disabled');
          }
          return exportToPDF(...args);
        },
      },
    };
  }
}
