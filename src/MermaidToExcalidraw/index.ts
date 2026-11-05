// Shared with the plugin's exact requirement: converter 3.6 and legacy curve compatibility.
export const MERMAID_COMPONENT_VERSION = '3.6.0';

export function getMermaidVersion(): string {
  return MERMAID_COMPONENT_VERSION;
}

export async function getModule(): Promise<
  import('../api/ExcalidrawExtrasAPI').ExtrasMermaidModule
> {
  const module = await import('@excalidraw/mermaid-to-excalidraw');
  return {
    ...module,
    parseMermaidToExcalidraw: async (definition, config) => {
      if (config?.flowchart?.curve !== undefined) {
        const { parseWithLegacyCurve } = await import('./legacyCurve');
        return parseWithLegacyCurve(definition, config);
      }
      return module.parseMermaidToExcalidraw(definition, config);
    },
  };
}
