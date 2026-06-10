import { App, PluginSettingTab, Setting } from 'obsidian';
import type ExcalidrawExtrasPlugin from './main';
import type { ExtrasComponent } from './api/ExcalidrawExtrasAPI';

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

  private getNoticeText(component: ExtrasComponent): string {
    const timeout = this.plugin.temporaryTimeouts[component];
    if (timeout === undefined) return '';
    if (timeout === -1) return ' (Enabled for this session)';

    const minsRemaining = Math.max(
      1,
      Math.ceil((timeout - Date.now()) / 60000),
    );
    return ` (Temporarily enabled: ~${minsRemaining} min remaining)`;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const addSetting = (
      component: ExtrasComponent,
      name: string,
      desc: string,
      settingKey: keyof ExcalidrawExtrasSettings,
    ) => {
      const noticeText = this.getNoticeText(component);
      const isTemporarilyActive = noticeText !== '';

      const setting = new Setting(containerEl)
        .setName(name + noticeText)
        .setDesc(desc);

      if (isTemporarilyActive) {
        setting.nameEl.addClass('mod-warning');
      }

      setting.addToggle((toggle) =>
        toggle
          // The toggle shows "true" if it's either permanently OR temporarily enabled
          .setValue(this.plugin.settings[settingKey] || isTemporarilyActive)
          .onChange((value) => {
            // If the user interacts with the toggle, immediately clear any temporary logic
            this.plugin.clearTimer(component);

            // Set permanent state
            this.plugin.settings[settingKey] = value;
            void this.plugin.saveSettings();

            // Force a re-render of the settings tab to remove the orange text
            this.display();
          }),
      );
    };

    addSetting(
      'mathjax',
      'Enable MathJax to SVG',
      'Turns on the MathJax conversion service API.',
      'enableMathJaxToSVG',
    );

    addSetting(
      'mermaid',
      'Enable Mermaid to Excalidraw',
      'Turns on the Mermaid diagram parsing service API.',
      'enableMermaidToExcalidraw',
    );

    addSetting(
      'pdf',
      'Enable PDF Export',
      'Turns on high-privilege PDF printing capabilities.',
      'enablePDFExport',
    );

    addSetting(
      'filesystem',
      'Enable Local File System Access',
      'Permits Excalidraw to access files outside the standard Obsidian vault (requires desktop).',
      'enableFileSystem',
    );
  }
}
