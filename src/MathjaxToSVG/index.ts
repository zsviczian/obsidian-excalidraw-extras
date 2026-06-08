import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { LiteAdaptor, liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { customAlphabet } from "nanoid";

export const MATHJAX_COMPONENT_VERSION = '1.0.0';

export function getMathJaxVersion(): string {
  return MATHJAX_COMPONENT_VERSION;
}

export type DataURL = string & { _brand: "DataURL" };
export type FileId = string & { _brand: "FileId" };
const fileid = customAlphabet("1234567890abcdef", 40);

let adaptor: LiteAdaptor | null = null;
let html: ReturnType<typeof mathjax.document> | null = null;

function svgToBase64(svg: string): string {
  const cleanSvg = svg.replaceAll("&nbsp;", " ");
  const encodedData = encodeURIComponent(cleanSvg)
    .replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode(parseInt(p1, 16))
    );
  return `data:image/svg+xml;base64,${btoa(encodedData)}`;
}

async function getImageSize(src: string): Promise<{ height: number; width: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ height: img.naturalHeight, width: img.naturalWidth });
    img.onerror = reject;
    img.src = src;
  });
}

// NOTE: preamble is now passed as a string from the parent plugin
export async function tex2dataURL(
  tex: string,
  scale: number = 4,
  preamble: string | null = null
): Promise<{
  mimeType: string;
  fileId: FileId;
  dataURL: DataURL;
  created: number;
  size: { height: number; width: number };
} | null> {
  let input: TeX<Record<string, never>, Record<string, never>, Record<string, never>>;
  let output: SVG<Record<string, never>, Record<string, never>, Record<string, never>>;

  if (!adaptor) {
    adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    input = new TeX({
      packages: AllPackages,
      ...(preamble ? {
        inlineMath: [['$', '$']],
        displayMath: [['$$', '$$']]
      } : {}),
    });
    output = new SVG({ fontCache: "local" });
    html = mathjax.document("", { InputJax: input, OutputJax: output });
  }

  if (!html) {
    return null;
  }

  try {
    const node = html.convert(
      preamble ? `${preamble}\n${tex}` : tex,
      { display: true, scale }
    );
    const svg = new DOMParser().parseFromString(adaptor.innerHTML(node), "image/svg+xml").firstChild as SVGSVGElement;

    svg.insertAdjacentHTML("beforeend", "<style>.mjx-solid { stroke-width: 80px; }</style>");

    if (svg) {
      if (svg.width.baseVal.valueInSpecifiedUnits < 2) {
        svg.width.baseVal.valueAsString = `${(svg.width.baseVal.valueInSpecifiedUnits + 1).toFixed(3)}ex`;
      }
      const img = svgToBase64(svg.outerHTML);
      svg.width.baseVal.valueAsString = (svg.width.baseVal.valueInSpecifiedUnits * 10).toFixed(3);
      svg.height.baseVal.valueAsString = (svg.height.baseVal.valueInSpecifiedUnits * 10).toFixed(3);
      const dataURL = svgToBase64(svg.outerHTML);

      return {
        mimeType: "image/svg+xml",
        fileId: fileid() as FileId,
        dataURL: dataURL as DataURL,
        created: Date.now(),
        size: await getImageSize(img),
      };
    }
  } catch (e) {
    console.error("ExcalidrawExtras MathJax Error:", e);
  }
  return null;
}

export function clearMathJaxVariables(): void {
  adaptor = null;
  html = null;
}