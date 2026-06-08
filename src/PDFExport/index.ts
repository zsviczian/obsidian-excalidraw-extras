export const PDF_COMPONENT_VERSION = '0.0.0';

export function initializePDFExport(): void {
  // Placeholder for future high-privilege IPC and filesystem setup.
}

export async function exportToPDF(
  _fileId: string,
  _options: unknown,
): Promise<void> {
  // Placeholder for future Obsidian desktop-only PDF export implementation.
  throw new Error('PDF export is not implemented yet.');
}

export function getPDFVersion(): string {
  return PDF_COMPONENT_VERSION;
}
