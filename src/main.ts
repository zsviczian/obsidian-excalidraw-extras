import { Plugin, App, Notice } from 'obsidian';
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
  getModule as getMermaidModule,
} from './MermaidToExcalidraw';
import { exportToPDF, getPDFVersion, initializePDFExport } from './PDFExport';
import {
  getFileSystemVersion,
  readLocalFile,
  readLocalFileBinary,
} from './FileSystem';
import {
  DEFAULT_SETTINGS,
  ExcalidrawExtrasSettingTab,
  ExcalidrawExtrasSettings,
} from './settings';

export default class ExcalidrawExtrasPlugin extends Plugin {
  public settings: ExcalidrawExtrasSettings = DEFAULT_SETTINGS;
  public api!: ExcalidrawExtrasAPI;

  // Public so settings.ts can read the remaining time for UI updates
  public temporaryTimeouts: Partial<Record<ExtrasComponent, number>> = {};
  public activeTimers: Partial<Record<ExtrasComponent, number>> = {};

  async onload(): Promise<void> {
    await this.loadSettings();
    this.api = this.createAPI();

    if (this.settings.enablePDFExport) {
      initializePDFExport();
    }

    this.addSettingTab(new ExcalidrawExtrasSettingTab(this.app, this));
  }

  onunload(): void {
    clearMathJaxVariables();
    Object.values(this.activeTimers).forEach((timer) =>
      window.clearTimeout(timer),
    );
  }

  /**
   * SECURITY LAYER: Inspects the JavaScript call stack.
   * If the call doesn't originate from the official Excalidraw plugin
   * or the Extras plugin itself, it throws a strict security error.
   */
  private verifyCaller() {
    const stack = new Error().stack || '';
    // This checks for both local dev paths and Obsidian's compiled "plugin:" references
    const isFromMain = stack.includes('obsidian-excalidraw-plugin');
    const isFromExtras = stack.includes('excalidraw-extras');

    if (!isFromMain && !isFromExtras) {
      console.warn('Blocked unauthorized API call. Stack trace:', stack);
      throw new Error(
        'Unauthorized caller. Security policy restricts this action to the official Excalidraw plugin.',
      );
    }
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
    if (typeof candidate.enableFileSystem === 'boolean') {
      this.settings.enableFileSystem = candidate.enableFileSystem;
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

  public clearTimer(component: ExtrasComponent) {
    delete this.temporaryTimeouts[component];
    if (this.activeTimers[component]) {
      window.clearTimeout(this.activeTimers[component]);
      delete this.activeTimers[component];
    }
  }

  private createAPI(): ExcalidrawExtrasAPI {
    return {
      versions: {
        mathjax: getMathJaxVersion(),
        mermaid: getMermaidVersion(),
        pdf: getPDFVersion(),
        filesystem: getFileSystemVersion(),
      },
      features: {
        isActive: (component: ExtrasComponent) => {
          if (this.temporaryTimeouts[component] !== undefined) return true;
          switch (component) {
            case 'mathjax':
              return this.settings.enableMathJaxToSVG;
            case 'mermaid':
              return this.settings.enableMermaidToExcalidraw;
            case 'pdf':
              return this.settings.enablePDFExport;
            case 'filesystem':
              return this.settings.enableFileSystem;
            default:
              return false;
          }
        },
        enable: async (
          component: ExtrasComponent,
          durationMinutes: number = 0,
        ) => {
          this.verifyCaller();
          this.clearTimer(component);

          if (durationMinutes === -1) {
            this.temporaryTimeouts[component] = -1; // Session only flag
          } else if (durationMinutes > 0) {
            this.temporaryTimeouts[component] =
              Date.now() + durationMinutes * 60000;
            this.activeTimers[component] = window.setTimeout(() => {
              void (async () => {
                await this.api.features.disable(component);
                new Notice(
                  `Excalidraw Extras: ${component} timer expired. Feature disabled.`,
                );
              })();
            }, durationMinutes * 60000);
          } else {
            // Permanent
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
              case 'filesystem':
                this.settings.enableFileSystem = true;
                break;
            }
            await this.saveSettings();
          }
        },
        disable: async (component: ExtrasComponent) => {
          this.verifyCaller();
          this.clearTimer(component);
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
            case 'filesystem':
              this.settings.enableFileSystem = false;
              break;
          }
          await this.saveSettings();
        },
      },
      mathjax: {
        tex2dataURL: async (...args) => {
          this.verifyCaller();
          if (!this.api.features.isActive('mathjax')) return null;
          return tex2dataURL(...args);
        },
        clearMathJaxVariables,
      },
      mermaid: {
        getModule: async () => {
          this.verifyCaller();
          if (!this.api.features.isActive('mermaid')) {
            throw new Error(
              'Mermaid feature is disabled. Please enable it in the Excalidraw Extras settings.',
            );
          }
          return getMermaidModule();
        },
      },
      pdf: {
        exportToPDF: async (...args) => {
          this.verifyCaller();
          if (!this.api.features.isActive('pdf')) {
            throw new Error('PDF export feature is disabled');
          }
          return exportToPDF(...args);
        },
      },
      filesystem: {
        readLocalFile: async (filePath: string, app: App) => {
          this.verifyCaller();
          if (!this.api.features.isActive('filesystem')) {
            throw new Error('Local File System Access is disabled');
          }
          return readLocalFile(filePath, app);
        },
        readLocalFileBinary: async (filePath: string, app: App) => {
          this.verifyCaller();
          if (!this.api.features.isActive('filesystem')) {
            throw new Error('Local File System Access is disabled');
          }
          return readLocalFileBinary(filePath, app);
        },
      },
    };
  }
}
