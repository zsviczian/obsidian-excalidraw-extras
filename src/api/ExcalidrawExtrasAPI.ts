export interface ExcalidrawExtrasAPI {
versions: {
mathjax: string;
mermaid: string;
pdf: string;
};
mathjax: {
tex2SVG: (equation: string) => Promise<SVGElement | string>;
};
mermaid: {
parseMermaid: (code: string) => Promise<unknown>;
};
pdf: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- API placeholder until PDF options are typed.
exportToPDF: (fileId: string, options: any) => Promise<void>;
};
}
