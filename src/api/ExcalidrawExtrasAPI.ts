import type { DataURL, FileId } from '../MathjaxToSVG';
import { PageDimensions, PageSize } from '../PDFExport/pdfExportTypes';

export type ExtrasComponent = 'mathjax' | 'mermaid' | 'pdf';

export interface ExcalidrawExtrasAPI {
  versions: {
    mathjax: string;
    mermaid: string;
    pdf: string;
  };
  features: {
    isActive(component: ExtrasComponent): boolean;
    enable(component: ExtrasComponent, temporary?: boolean): Promise<void>;
    disable(component: ExtrasComponent): Promise<void>;
  };
  mathjax: {
    tex2dataURL(
      tex: string,
      scale?: number,
      preamble?: string | null,
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
    getModule(): Promise<typeof import("@excalidraw/mermaid-to-excalidraw")>;
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
}
