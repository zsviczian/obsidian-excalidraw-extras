import type { DataURL, FileId, MathJaxRenderOptions } from '../MathjaxToSVG';
import { PageDimensions, PageSize } from '../PDFExport/pdfExportTypes';
import type { MermaidConfig } from '@excalidraw/mermaid-to-excalidraw';

/** Retain the existing caller curve default alongside converter 3.6 options. */
export type ExtrasMermaidConfig = MermaidConfig & {
  flowchart?: { curve?: 'linear' | 'basis' };
};

/** Extras keeps its legacy options while the pinned upstream converter evolves. */
export type ExtrasMermaidModule = {
  parseMermaidToExcalidraw(
    definition: string,
    config?: ExtrasMermaidConfig,
  ): ReturnType<
    typeof import('@excalidraw/mermaid-to-excalidraw').parseMermaidToExcalidraw
  >;
};

export type ExtrasComponent = 'mathjax' | 'mermaid' | 'pdf' | 'filesystem';

export interface ExcalidrawExtrasAPI {
  versions: {
    mathjax: string;
    mermaid: string;
    pdf: string;
    filesystem: string;
  };
  features: {
    isActive(component: ExtrasComponent): boolean;
    enable(component: ExtrasComponent, durationMinutes?: number): Promise<void>;
    disable(component: ExtrasComponent): Promise<void>;
  };
  mathjax: {
    tex2dataURL(
      tex: string,
      scale?: number,
      preamble?: string | null,
      options?: MathJaxRenderOptions,
    ): Promise<{
      mimeType: string;
      fileId: FileId;
      dataURL: DataURL;
      created: number;
      size: { height: number; width: number };
    } | null>;
    clearMathJaxVariables(): void;
  };
  mermaid: {
    getModule(): Promise<ExtrasMermaidModule>;
  };
  pdf: {
    exportToPDF(
      elementToPrint: HTMLElement,
      pdfPath: string,
      bgColor: string,
      pageSize: PageSize | PageDimensions,
      isLandscape: boolean,
      margins: { top: number; left: number; right: number; bottom: number },
      shouldOpen?: boolean,
      extraCss?: string,
      pageRanges?: string | { from: number; to: number }[],
    ): Promise<void>;
  };
  filesystem: {
    readLocalFile(filePath: string, app: unknown): Promise<string | null>;
    readLocalFileBinary(
      filePath: string,
      app: unknown,
    ): Promise<ArrayBuffer | null>;
  };
}
