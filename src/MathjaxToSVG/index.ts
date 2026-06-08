import { liteAdaptor, LiteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { SVG } from 'mathjax-full/js/output/svg.js';

export const MATHJAX_COMPONENT_VERSION = '1.0.0';

let adaptor: LiteAdaptor | null = null;
// eslint-disable-next-line obsidianmd/prefer-active-doc -- MathJax API exposes `document`.
let html: ReturnType<typeof mathjax.document> | null = null;

export function initializeMathJaxToSVG(): void {
if (adaptor && html) {
return;
}

adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const input = new TeX({ packages: AllPackages });
const output = new SVG({ fontCache: 'local' });
html = mathjax.document('', {
InputJax: input,
OutputJax: output,
});
}

export async function tex2SVG(equation: string): Promise<string> {
if (!html || !adaptor) {
initializeMathJaxToSVG();
}

const converted = html!.convert(equation, {
display: true,
}) as unknown;
const node = converted as Parameters<LiteAdaptor['innerHTML']>[0];
return adaptor!.innerHTML(node);
}

export function getMathJaxVersion(): string {
return MATHJAX_COMPONENT_VERSION;
}
