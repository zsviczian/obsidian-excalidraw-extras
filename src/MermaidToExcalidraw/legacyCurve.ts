/**
 * Preserve the caller's linear/basis default removed from converter 3.6's public
 * options (fork PR #482). Use its pinned Pele/converter pipeline directly only
 * for the legacy option, without rewriting source, line numbers or front matter.
 * Definition configuration keeps the same precedence as in converter 3.1.
 * Author: zsviczian. https://github.com/zsviczian/excalidraw/pull/482
 * These internal imports require regression checks on each converter upgrade.
 */
import { DEFAULT_FONT_SIZE } from '@excalidraw/mermaid-to-excalidraw/dist/constants.js';
import { GraphImageConverter } from '@excalidraw/mermaid-to-excalidraw/dist/converter/types/graphImage.js';
import { convertGraph } from '@excalidraw/mermaid-to-excalidraw/dist/diagrams/index.js';
import { parsePele } from '@excalidraw/mermaid-to-excalidraw/dist/pele/parsePele.js';
import { normalizeLinearElementPoints } from '@excalidraw/mermaid-to-excalidraw/dist/utils.js';
import type { ExtrasMermaidConfig } from '../api/ExcalidrawExtrasAPI';

/** Run the same upstream conversion stages with the legacy caller curve. */
export async function parseWithLegacyCurve(
  definition: string,
  config: ExtrasMermaidConfig,
) {
  const fontSize =
    parseInt(config.themeVariables?.fontSize ?? '') || DEFAULT_FONT_SIZE;
  const graph = await parsePele(definition, {
    fontSize,
    maxEdges: config.maxEdges,
    maxTextSize: config.maxTextSize,
    curve: config.flowchart?.curve,
    elbow: config.elbow,
  });
  return normalizeLinearElementPoints(
    graph.type === 'graphImage'
      ? GraphImageConverter.convert(graph, { fontSize })
      : await convertGraph(graph, { fontSize }),
  );
}
