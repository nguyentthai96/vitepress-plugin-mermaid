import { type UserConfig } from "vitepress";
import { MermaidMarkdown } from "./mermaid-markdown";
import { MermaidPlugin, MermaidPluginConfig } from "./mermaid-plugin";
import { MermaidConfig } from "mermaid";

export { MermaidMarkdown } from "./mermaid-markdown";
export { MermaidPlugin } from "./mermaid-plugin";

export { UserConfig };

declare module "vitepress" {
  interface UserConfig {
    mermaid?: MermaidConfig;
    mermaidPlugin?: MermaidPluginConfig;
  }
}

export const withMermaid = (config: UserConfig) => {
  if (!config.markdown) config.markdown = {};
  const markdownConfigOriginal = config.markdown.config || (() => {});
  config.markdown.config = (...args) => {
    MermaidMarkdown(...args, config.mermaidPlugin);
    markdownConfigOriginal(...args);
  };

  if (!config.vite) config.vite = {};
  if (!config.vite.plugins) config.vite.plugins = [];
  config.vite.plugins.push(MermaidPlugin(config.mermaid));
  if (!config.vite.optimizeDeps) config.vite.optimizeDeps = {};
  if (!config.vite.optimizeDeps.include) config.vite.optimizeDeps.include = [];

  config.vite.optimizeDeps.include = [
    ...config.vite.optimizeDeps.include,
    "mermaid",
    "@braintree/sanitize-url",
    "dayjs",
    "cytoscape-cose-bilkent",
    "cytoscape",
    "elkjs",
  ];

  if (!config.vite.resolve) config.vite.resolve = {};

  const mermaidPluginAlias = {
    "dayjs/plugin/advancedFormat.js": "dayjs/esm/plugin/advancedFormat",
    "dayjs/plugin/customParseFormat.js": "dayjs/esm/plugin/customParseFormat",
    "dayjs/plugin/isoWeek.js": "dayjs/esm/plugin/isoWeek",
    "cytoscape/dist/cytoscape.umd.js": "cytoscape/dist/cytoscape.esm.js",
  };

  if (!config.vite.resolve.alias)
    config.vite.resolve.alias = mermaidPluginAlias;
  else if (Array.isArray(config.vite.resolve.alias)) {
    config.vite.resolve.alias = [
      ...config.vite.resolve.alias,
      ...Object.entries(mermaidPluginAlias).map(([find, replacement]) => ({
        find,
        replacement,
      })),
    ];
  } else {
    config.vite.resolve.alias = {
      ...config.vite.resolve.alias,
      ...mermaidPluginAlias,
    };
  }

  // SSR config: mark mermaid and its CJS sub-deps as noExternal
  if (!config.vite.ssr) config.vite.ssr = {};
  if (!config.vite.ssr.noExternal) config.vite.ssr.noExternal = [];
  if (Array.isArray(config.vite.ssr.noExternal)) {
    config.vite.ssr.noExternal.push("mermaid");
  }

  // Build config: ensure Rollup's commonjs plugin properly handles
  // CJS sub-dependencies of mermaid (fastdom, elkjs, etc.)
  if (!config.vite.build) config.vite.build = {};
  if (!config.vite.build.commonjsOptions) config.vite.build.commonjsOptions = {};
  // Include mermaid's CJS deps in the commonjs transformation
  if (!config.vite.build.commonjsOptions.include) {
    config.vite.build.commonjsOptions.include = [/node_modules/];
  }

  return config;
};
