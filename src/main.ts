import { Plugin, App } from 'obsidian';
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
  private temporaryOverrides: Record<string, boolean> = {};

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
          if (this.temporaryOverrides[component]) return true;
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
              case 'filesystem':
                this.settings.enableFileSystem = true;
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
            case 'filesystem':
              this.settings.enableFileSystem = false;
              break;
          }
          await this.saveSettings();
        },
      },
      mathjax: {
        tex2dataURL: async (...args) => {
          if (!this.api.features.isActive('mathjax')) return null;
          return tex2dataURL(...args);
        },
        clearMathJaxVariables,
      },
      mermaid: {
        getModule: async () => {
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
          if (!this.api.features.isActive('pdf')) {
            throw new Error('PDF export feature is disabled');
          }
          return exportToPDF(...args);
        },
      },
      filesystem: {
        readLocalFile: async (filePath: string, app: App) => {
          if (!this.api.features.isActive('filesystem')) {
            throw new Error('Local File System Access is disabled');
          }
          return readLocalFile(filePath, app);
        },
        readLocalFileBinary: async (filePath: string, app: App) => {
          if (!this.api.features.isActive('filesystem')) {
            throw new Error('Local File System Access is disabled');
          }
          return readLocalFileBinary(filePath, app);
        },
      },
    };
  }
}
