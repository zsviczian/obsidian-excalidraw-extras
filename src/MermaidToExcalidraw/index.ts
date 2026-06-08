export const MERMAID_COMPONENT_VERSION = '1.0.0';

export function initializeMermaidToExcalidraw(): void {
  // Placeholder for future Mermaid parser/bootstrap wiring.
}

export async function parseMermaid(code: string): Promise<unknown> {
  // Placeholder for future large Mermaid parser logic.
  return { code, supported: false };
}

export function getMermaidVersion(): string {
  return MERMAID_COMPONENT_VERSION;
}
