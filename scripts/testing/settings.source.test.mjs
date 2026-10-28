import assert from 'node:assert/strict';
import test from 'node:test';
import {sourceHarness} from './sourceHarness.mjs';
for (const declarative of [false,true]) test('actual settings '+(declarative?'declarative':'legacy')+' path preserves transient labels and writes explicit permanent choice',async t=>{
  const rendered=[];
  class Setting {
    nameEl={addClass:value=>{this.warning=value;}};
    constructor(){rendered.push(this);}
    setName(value){this.name=value;return this;} setDesc(value){this.desc=value;return this;}
    addToggle(callback){this.toggle={setValue:value=>{this.value=value;return this.toggle;},onChange:callback=>{this.change=callback;return this.toggle;}};callback(this.toggle);return this;}
  }
  class PluginSettingTab {constructor(){this.containerEl={empty:()=>{rendered.length=0;}};}}
  const graph=sourceHarness({obsidian:{PluginSettingTab,Setting}});t.after(()=>graph.close());
  const {ExcalidrawExtrasSettingTab,DEFAULT_SETTINGS}=await graph.importModule('src/settings.ts');
  let writes=0,updates=0;
  const plugin={settings:{...DEFAULT_SETTINGS,enableMermaidToExcalidraw:false},temporaryTimeouts:{mermaid:-1},clearTimer(component){delete this.temporaryTimeouts[component];},async saveSettings(){writes++;}};
  const tab=new ExcalidrawExtrasSettingTab({},plugin);
  if(declarative){tab.update=()=>{updates++;};for(const definition of tab.getSettingDefinitions())definition.render(new Setting());}else tab.display();
  assert.equal(rendered.length,4);
  const mermaid=rendered.find(row=>row.name.includes('Mermaid'));
  assert.match(mermaid.name,/Enabled for this session/);assert.equal(mermaid.value,true);assert.equal(mermaid.warning,'mod-warning');
  mermaid.change(false);await Promise.resolve();assert.equal(plugin.settings.enableMermaidToExcalidraw,false);assert.equal(plugin.temporaryTimeouts.mermaid,undefined);assert.equal(writes,1);
  if(declarative)assert.equal(updates,1);else assert.ok(!rendered.find(row=>row.name.includes('Mermaid')).name.includes('session'));
});
