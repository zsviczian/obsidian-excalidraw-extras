import type { DataURL, FileId } from '../MathjaxToSVG';

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
    parseMermaid?: unknown; // Stubs for future implementation
  };
  pdf: {
    exportToPDF?: unknown; // Stubs for future implementation
  };
}