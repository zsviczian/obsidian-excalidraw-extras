/** Verify packed generated declarations from a clean, independently resolved consumer. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const work=join(root,'.test-work/consumers',randomUUID()); mkdirSync(work,{recursive:true});
const npm=[process.env.npm_execpath,join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),join(dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')].filter(Boolean).find(existsSync);
assert.ok(npm,'Run through npm run test:package or install npm beside Node');
function command(args,cwd=root){const result=spawnSync(process.execPath,[npm,...args],{cwd,encoding:'utf8',windowsHide:true,timeout:180000});assert.equal(result.status,0,result.error?.message||result.stderr||result.stdout);return result.stdout;}
const packed=JSON.parse(command(['pack','--ignore-scripts','--json','--pack-destination',work]));
const entries=Array.isArray(packed)?packed:Object.values(packed);assert.equal(entries.length,1,'Exactly one package must be packed');const pack=entries[0];
assert.ok(pack.files.some(file=>file.path==='api/api/index.d.ts'));
assert.ok(pack.files.some(file=>file.path==='api/MathjaxToSVG/index.d.ts'));
assert.ok(!pack.files.some(file=>file.path.startsWith('scripts/')||file.path.startsWith('tests/')||file.path.startsWith('.test-work/')));
writeFileSync(join(work,'package.json'),JSON.stringify({private:true,type:'module'}));
command(['install','--prefer-offline','--ignore-scripts','--no-audit','--no-fund',join(work,pack.filename)],work);
writeFileSync(join(work,'consumer.ts'),`import type {ExcalidrawExtrasAPI, MathJaxRenderOptions} from '@zsviczian/excalidraw-extras-api';
declare const api: ExcalidrawExtrasAPI;
const options: MathJaxRenderOptions={throwOnError:true};
const tex = api.mathjax.tex2dataURL('x',1,null,options);
const mermaid=api.mermaid.getModule();
const fs:Promise<ArrayBuffer|null> = api.filesystem.readLocalFileBinary('owned',{});
const pdf:Promise<void> = api.pdf.exportToPDF(document.body,'owned.pdf','#fff','A4',false,{top:0,left:0,right:0,bottom:0});
// @ts-expect-error unknown component must remain a type error
api.features.enable('unknown');
void [tex,mermaid,fs,pdf];`);
const checked=spawnSync(process.execPath,[join(root,'node_modules/typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','consumer.ts'],{cwd:work,encoding:'utf8',windowsHide:true,timeout:60000});
assert.equal(checked.status,0,checked.stdout||checked.stderr);
writeFileSync(join(work,'evidence.json'),JSON.stringify({package:pack.name,version:pack.version,sha512:pack.integrity,files:pack.files.length,status:'passed',consumer:'isolated install of packed package; generated API calls and invalid-input type rejection'},null,2));
console.log('Packed Extras API consumer passed: '+work);
