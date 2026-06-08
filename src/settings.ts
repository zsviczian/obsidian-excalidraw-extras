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
  private readonly plugin: ExcalidrawExtrasPlugin;

  constructor(app: App, plugin: ExcalidrawExtrasPlugin) {
    super(app, plugin);
    this.plugin = plugin;
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
          .onChange(async (value) => {
            this.plugin.settings.enableMathJaxToSVG = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
