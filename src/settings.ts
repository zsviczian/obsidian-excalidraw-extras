import { App, PluginSettingTab, Setting } from 'obsidian';
import type ExcalidrawExtrasPlugin from './main';

export interface ExcalidrawExtrasSettings {
  enableMathJaxToSVG: boolean;
  enableMermaidToExcalidraw: boolean;
  enablePDFExport: boolean;
}

export const DEFAULT_SETTINGS: ExcalidrawExtrasSettings = {
  enableMathJaxToSVG: true,
  enableMermaidToExcalidraw: false,
  enablePDFExport: false,
};

export class ExcalidrawExtrasSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: ExcalidrawExtrasPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Enable MathJax to SVG')
      .setDesc('Turns on the mathjax conversion service API.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableMathJaxToSVG).onChange(async (value) => {
          this.plugin.settings.enableMathJaxToSVG = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Enable Mermaid to Excalidraw')
      .setDesc('Turns on the Mermaid diagram parsing service API.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableMermaidToExcalidraw).onChange(async (value) => {
          this.plugin.settings.enableMermaidToExcalidraw = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Enable PDF Export')
      .setDesc('Turns on high-privilege PDF printing capabilities.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enablePDFExport).onChange(async (value) => {
          this.plugin.settings.enablePDFExport = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}