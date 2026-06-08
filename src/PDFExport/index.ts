export const PDF_COMPONENT_VERSION = '0.0.0';

export function initializePDFExport(): void {
// Placeholder for future high-privilege IPC and filesystem setup.
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder until IPC contract is defined.
export async function exportToPDF(_fileId: string, _options: any): Promise<void> {
// Placeholder for future Obsidian desktop-only PDF export implementation.
throw new Error('PDF export is not implemented yet.');
}

export function getPDFVersion(): string {
return PDF_COMPONENT_VERSION;
}
