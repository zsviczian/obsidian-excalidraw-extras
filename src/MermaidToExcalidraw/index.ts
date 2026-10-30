// Unreleased service contract shared with the plugin; independent of converter releases (#478).
export const MERMAID_COMPONENT_VERSION = '3.0.0';

export function getMermaidVersion(): string {
  return MERMAID_COMPONENT_VERSION;
}

export async function getModule(): Promise<
  typeof import('@excalidraw/mermaid-to-excalidraw')
> {
  // Returns the entire module dynamically so we don't have to map individual functions.
  // This satisfies Excalidraw's runtime expectation seamlessly.
  return await import('@excalidraw/mermaid-to-excalidraw');
}
