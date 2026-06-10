import { App, PluginSettingTab, Setting } from 'obsidian';
import type ExcalidrawExtrasPlugin from './main';

export interface ExcalidrawExtrasSettings {
  enableMathJaxToSVG: boolean;
  enableMermaidToExcalidraw: boolean;
  enablePDFExport: boolean;
  enableFileSystem: boolean;
}

export const DEFAULT_SETTINGS: ExcalidrawExtrasSettings = {
  enableMathJaxToSVG: true,
  enableMermaidToExcalidraw: true,
  enablePDFExport: true,
  enableFileSystem: true,
};

export class ExcalidrawExtrasSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: ExcalidrawExtrasPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Enable mathjax to SVG')
      .setDesc('Turns on the mathjax conversion service API.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableMathJaxToSVG)
          .onChange((value) => {
            this.plugin.settings.enableMathJaxToSVG = value;
            void this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Enable Mermaid to Excalidraw')
      .setDesc('Turns on the Mermaid diagram parsing service API.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableMermaidToExcalidraw)
          .onChange((value) => {
            this.plugin.settings.enableMermaidToExcalidraw = value;
            void this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Enable PDF export')
      .setDesc('Turns on high-privilege PDF printing capabilities.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enablePDFExport)
          .onChange((value) => {
            this.plugin.settings.enablePDFExport = value;
            void this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName('Enable Local File System Access')
      .setDesc('Permits Excalidraw to access files outside the standard Obsidian Vault (Requires Desktop).')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableFileSystem)
          .onChange((value) => {
            this.plugin.settings.enableFileSystem = value;
            void this.plugin.saveSettings();
          }),
      );
  }
}
