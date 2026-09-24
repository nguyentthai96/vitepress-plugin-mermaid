import mermaid from "mermaid";
import type { ExternalDiagramDefinition, MermaidConfig } from "mermaid";

export const init = async (externalDiagrams: ExternalDiagramDefinition[]) => {
  try {
    // registerExternalDiagrams is available in mermaid 10, 11, and 12
    if (mermaid.registerExternalDiagrams) {
      await mermaid.registerExternalDiagrams(externalDiagrams);
    }
  } catch (e) {
    console.error("[vitepress-plugin-mermaid] Failed to register external diagrams:", e);
  }
};

export const render = async (
  id: string,
  code: string,
  config: MermaidConfig
): Promise<string> => {
  mermaid.initialize(config);
  const { svg } = await mermaid.render(id, code);
  return svg;
};
