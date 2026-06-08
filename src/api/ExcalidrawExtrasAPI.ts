import type { DataURL, FileId } from "../MathjaxToSVG";

export interface ExcalidrawExtrasAPI {
  versions: {
    mathjax: string;
    mermaid: string;
    pdf: string;
  };
  mathjax: {
    tex2dataURL(tex: string, scale?: number, preamble?: string | null): Promise<{
      mimeType: string;
      fileId: FileId;
      dataURL: DataURL;
      created: number;
      size: { height: number; width: number };
    } | null>;
    clearMathJaxVariables(): void;
  };
  mermaid: {
    parseMermaid?: any; // Stubs for future implementation
  };
  pdf: {
    exportToPDF?: any;  // Stubs for future implementation
  }
}