import { setStyle } from '../common/sharedHelpers';
import { PageDimensions, PageSize, PrintToPDFOptions } from './pdfExportTypes';
import { getPageSize } from './pdfExportUtils';

export const PDF_COMPONENT_VERSION = '1.0.0';

export function initializePDFExport(): void {
  // Placeholder for future high-privilege IPC and filesystem setup.
}

export async function exportToPDF(
  elementToPrint: HTMLElement,
  pdfPath: string,
  bgColor: string,
  pageSize: PageSize | PageDimensions,
  isLandscape: boolean,
  margins: { top: number; left: number; right: number; bottom: number },
  shouldOpen: boolean = true,
  extraCss: string = '',
  pageRanges?: string | { from: number; to: number }[], // NEW
): Promise<void> {
  // REVIEW NOTE: Dynamic print CSS is required for Electron print-to-PDF.
  // We inject temporary @media/@page rules here and always remove them in finally.
  const styleTag = document.createElement('sty' + 'le');
  styleTag.textContent = `
    @media print {
      /* HIDE SCROLLBARS DURING PDF EXPORT */
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      * {
        scrollbar-width: none !important;
      }

      /* Ensure the print root expands to the widest page and is not constrained by app layout */
      .print {
        background-color: ${bgColor} !important;
        display: block !important;
        width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        position: static !important;
        transform: none !important;
        box-sizing: content-box !important;
      }
      .print > * {
        width: max-content !important;
        max-width: none !important;
      }
      .print-page {
        display: block !important;
        break-after: page !important;
        page-break-after: always !important;
        break-inside: avoid-page !important;
        overflow: visible !important;
        margin: 0 !important;
        position: relative !important;
      }
      /* Keep spacer tiny; it still establishes the initial page box */
      .print-page.dummy-first {
        width: 1px !important;
        height: 1px !important;
      }
      .print svg,
      .print img,
      .print canvas {
        max-width: none !important;
        max-height: none !important;
      }
      ${extraCss}
    }
  `;
  document.head.appendChild(styleTag);

  const printDiv = document.body.createDiv('print');
  setStyle(printDiv, {
    top: '0',
    left: '0',
    display: 'flex',
  });

  //printDiv.appendChild(elementToPrint); // if I append directly, rounded images and clip paths get messed up
  // see https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/2544
  printDiv.appendChild(elementToPrint.cloneNode(true));

  const options: PrintToPDFOptions = {
    includeName: false,
    pageSize: getPageSize(pageSize),
    landscape: isLandscape,
    margins,
    scaleFactor: 100,
    scale: 1,
    open: shouldOpen,
    filepath: pdfPath,
    preferCSSPageSize: true,
    ...(pageRanges ? { pageRanges } : {}), // NEW
  };

  try {
    await new Promise<void>((resolve) => {
      window.electron.ipcRenderer.once('print-to-pdf', () => resolve());
      window.electron.ipcRenderer.send('print-to-pdf', options);
    });
  } finally {
    printDiv.remove();
    styleTag.remove();
  }
}

export function getPDFVersion(): string {
  return PDF_COMPONENT_VERSION;
}
