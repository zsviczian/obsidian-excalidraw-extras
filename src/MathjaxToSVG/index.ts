import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import {
  LiteAdaptor,
  liteAdaptor,
} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { ALL_PACKAGES } from './packages';
import type TexError from 'mathjax-full/js/input/tex/TexError.js';
import { customAlphabet } from 'nanoid';

export const MATHJAX_COMPONENT_VERSION = '1.1.1';

export function getMathJaxVersion(): string {
  return MATHJAX_COMPONENT_VERSION;
}

export type DataURL = string & { _brand: 'DataURL' };
export type FileId = string & { _brand: 'FileId' };
export interface MathJaxRenderOptions {
  /** Propagate MathJax conversion errors instead of logging them and returning null. */
  throwOnError?: boolean;
}

export class MathJaxInitializationError extends Error {
  public readonly originalError: unknown;

  constructor(error: unknown) {
    const detail = error instanceof Error ? `: ${error.message}` : '';
    super(`MathJax renderer initialization failed${detail}`);
    this.name = 'MathJaxInitializationError';
    this.originalError = error;
  }
}

const fileid = customAlphabet('1234567890abcdef', 40);

let adaptor: LiteAdaptor | null = null;
let normalHtml: ReturnType<typeof mathjax.document> | null = null;
let strictHtml: ReturnType<typeof mathjax.document> | null = null;

// Dynamically extract the specific element type that LiteAdaptor uses
type MathJaxNode = Parameters<LiteAdaptor['innerHTML']>[0];

function svgToBase64(svg: string): string {
  const cleanSvg = svg.replaceAll('&nbsp;', ' ');
  const encodedData = encodeURIComponent(cleanSvg).replace(
    /%([0-9A-F]{2})/g,
    // Fix: Explicitly type the regex match and capture group as strings
    (_match: string, p1: string) => String.fromCharCode(parseInt(p1, 16)),
  );
  return `data:image/svg+xml;base64,${btoa(encodedData)}`;
}

async function getImageSize(
  src: string,
): Promise<{ height: number; width: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ height: img.naturalHeight, width: img.naturalWidth });
    img.onerror = reject;
    img.src = src;
  });
}

function ensureAdaptor(): LiteAdaptor {
  if (adaptor) return adaptor;

  try {
    adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    return adaptor;
  } catch (error) {
    adaptor = null;
    throw new MathJaxInitializationError(error);
  }
}

function createMathJaxDocument(
  throwOnError: boolean,
  preamble: string | null,
): ReturnType<typeof mathjax.document> {
  try {
    const input = new TeX({
      packages: throwOnError
        ? ALL_PACKAGES.filter(
            (packageName) =>
              packageName !== 'noerrors' && packageName !== 'noundefined',
          )
        : ALL_PACKAGES,
      ...(throwOnError
        ? {
            formatError: (_jax: unknown, error: TexError): never => {
              // eslint-disable-next-line @typescript-eslint/only-throw-error -- MathJax's TexError is its native error value but does not extend JavaScript Error.
              throw error;
            },
          }
        : {}),
      ...(preamble
        ? {
            inlineMath: [['$', '$']],
            displayMath: [['$$', '$$']],
          }
        : {}),
    });
    const output = new SVG({ fontCache: 'local' });
    return mathjax.document('', { InputJax: input, OutputJax: output });
  } catch (error) {
    throw new MathJaxInitializationError(error);
  }
}

/**
 * Initializes the default renderer so plugin startup can detect and contain
 * MathJax compatibility problems instead of failing the entire plugin load.
 */
export function initializeMathJaxRenderer(): void {
  ensureAdaptor();
  createMathJaxDocument(false, null);
}

// NOTE: preamble is now passed as a string from the parent plugin
export async function tex2dataURL(
  tex: string,
  scale: number = 4,
  preamble: string | null = null,
  options?: MathJaxRenderOptions,
): Promise<{
  mimeType: string;
  fileId: FileId;
  dataURL: DataURL;
  created: number;
  size: { height: number; width: number };
} | null> {
  const currentAdaptor = ensureAdaptor();
  const throwOnError = options?.throwOnError === true;
  let html = throwOnError ? strictHtml : normalHtml;

  if (!html) {
    html = createMathJaxDocument(throwOnError, preamble);
    if (throwOnError) {
      strictHtml = html;
    } else {
      normalHtml = html;
    }
  }

  try {
    // Fix: Cast the 'any' output to 'unknown' first, then strictly to 'MathJaxNode'
    const node = html.convert(preamble ? `${preamble}\n${tex}` : tex, {
      display: true,
      scale,
    }) as unknown as MathJaxNode;

    // node is now safely typed as MathJaxNode, which innerHTML perfectly accepts
    const svg = new DOMParser().parseFromString(
      currentAdaptor.innerHTML(node),
      'image/svg+xml',
    ).firstChild as SVGSVGElement;

    svg.insertAdjacentHTML(
      'beforeend',
      '<style>.mjx-solid { stroke-width: 80px; }</style>',
    );

    if (svg) {
      if (svg.width.baseVal.valueInSpecifiedUnits < 2) {
        svg.width.baseVal.valueAsString = `${(svg.width.baseVal.valueInSpecifiedUnits + 1).toFixed(3)}ex`;
      }
      const img = svgToBase64(svg.outerHTML);
      svg.width.baseVal.valueAsString = (
        svg.width.baseVal.valueInSpecifiedUnits * 10
      ).toFixed(3);
      svg.height.baseVal.valueAsString = (
        svg.height.baseVal.valueInSpecifiedUnits * 10
      ).toFixed(3);
      const dataURL = svgToBase64(svg.outerHTML);

      return {
        mimeType: 'image/svg+xml',
        fileId: fileid() as FileId,
        dataURL: dataURL as DataURL,
        created: Date.now(),
        size: await getImageSize(img),
      };
    }
  } catch (error) {
    if (throwOnError) {
      throw error;
    }
    console.error('ExcalidrawExtras MathJax Error:', error);
  }
  return null;
}

export function clearMathJaxVariables(): void {
  adaptor = null;
  normalHtml = null;
  strictHtml = null;
}
