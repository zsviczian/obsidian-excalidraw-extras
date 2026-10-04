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

type ExcalidrawExtrasSettingKey = keyof ExcalidrawExtrasSettings;

interface ComponentSettingDefinition {
  component: ExtrasComponent;
  name: string;
  desc: string;
  settingKey: ExcalidrawExtrasSettingKey;
}

const COMPONENT_SETTINGS: readonly ComponentSettingDefinition[] = [
  {
    component: 'mathjax',
    name: 'Enable MathJax to SVG',
    desc: 'Turns on the MathJax conversion service API.',
    settingKey: 'enableMathJaxToSVG',
  },
  {
    component: 'mermaid',
    name: 'Enable Mermaid to Excalidraw',
    desc: 'Turns on the Mermaid diagram parsing service API.',
    settingKey: 'enableMermaidToExcalidraw',
  },
  {
    component: 'pdf',
    name: 'Enable PDF Export',
    desc: 'Turns on high-privilege PDF printing capabilities.',
    settingKey: 'enablePDFExport',
  },
  {
    component: 'filesystem',
    name: 'Enable Local File System Access',
    desc: 'Permits Excalidraw to access files outside the standard Obsidian vault (requires desktop).',
    settingKey: 'enableFileSystem',
  },
];

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

  private configureToggleSetting(
    setting: Setting,
    definition: ComponentSettingDefinition,
  ): void {
    const { component, name, desc, settingKey } = definition;
    const noticeText = this.getNoticeText(component);
    const isTemporarilyActive = noticeText !== '';

    setting.setName(name + noticeText).setDesc(desc);

    if (isTemporarilyActive) {
      setting.nameEl.addClass('mod-warning');
    }

    setting.addToggle((toggle) =>
      toggle
        // The toggle shows "true" if it's either permanently OR temporarily enabled.
        .setValue(this.plugin.settings[settingKey] || isTemporarilyActive)
        .onChange((value) => {
          // If the user interacts with the toggle, immediately clear any temporary logic.
          this.plugin.clearTimer(component);

          // Set permanent state.
          this.plugin.settings[settingKey] = value;
          void this.plugin.saveSettings();

          // Obsidian 1.13+ renders declarative definitions via update().
          // Older versions only have the imperative display() path.
          const update = (this as unknown as { update?: () => void }).update;
          if (typeof update === 'function') {
            update.call(this);
          } else {
            this.display();
          }
        }),
    );
  }

  /**
   * Obsidian 1.13+ uses these definitions both for rendering and settings
   * search. The render callback preserves the session/timer UI behavior while
   * the display() method below remains the compatibility path for older apps.
   */
  getSettingDefinitions() {
    return COMPONENT_SETTINGS.map((definition) => ({
      name: definition.name,
      desc: definition.desc,
      render: (setting: Setting) => {
        this.configureToggleSetting(setting, definition);
      },
    }));
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    for (const definition of COMPONENT_SETTINGS) {
      this.configureToggleSetting(new Setting(containerEl), definition);
    }
  }
}
