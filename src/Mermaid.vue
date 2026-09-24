<template>
  <div v-html="svg" :class="props.class"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, toRaw } from "vue";
import { render, init } from "./mermaid";

//get mermaid settings
import { useData } from "vitepress";

const pluginSettings = ref({
  securityLevel: "loose",
  startOnLoad: false,
  externalDiagrams: [],
});
const { page } = useData();
const { frontmatter } = toRaw(page.value);
const mermaidPageTheme = frontmatter.mermaidTheme || "";

const props = defineProps({
  graph: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  class:{
    type: String,
    required: false,
    default: "mermaid",
  }
});

const svg = ref(null);
let mut = null;

onMounted(async () => {
  await init(pluginSettings.value.externalDiagrams);
  let settings = await import("virtual:mermaid-config");
  if (settings?.default) pluginSettings.value = settings.default;

  mut = new MutationObserver(async () => await renderChart());
  mut.observe(document.documentElement, { attributes: true });
  await renderChart();

  //refresh images on first render
  const hasImages =
    /<img([\w\W]+?)>/.exec(decodeURIComponent(props.graph))?.length > 0;
  if (hasImages)
    setTimeout(() => {
      let imgElements = document.getElementsByTagName("img");
      let imgs = Array.from(imgElements);
      if (imgs.length) {
        Promise.all(
          imgs
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise((resolve) => {
                  img.onload = img.onerror = resolve;
                })
            )
        ).then(async () => {
          await renderChart();
        });
      }
    }, 100);
});

onUnmounted(() => mut.disconnect());

const renderChart = async () => {
  const hasDarkClass = document.documentElement.classList.contains("dark");
  let mermaidConfig = {
    ...pluginSettings.value,
  };

  if (mermaidPageTheme) mermaidConfig.theme = mermaidPageTheme;
  if (hasDarkClass) mermaidConfig.theme = "dark";

  let svgCode = await render(
    props.id,
    decodeURIComponent(props.graph),
    mermaidConfig
  );
  // This is a hack to force v-html to re-render, otherwise the diagram disappears
  // when **switching themes** or **reloading the page**.
  // The cause is that the diagram is deleted during rendering (out of Vue's knowledge).
  // Because svgCode does NOT change, v-html does not re-render.
  // This is not required for all diagrams, but it is required for c4c, mindmap and zenuml.
  const salt = Math.random().toString(36).substring(7);
  svg.value = `${svgCode} <span style="display: none">${salt}</span>`;
};
</script>

<style>
/*
 * CSS Isolation for Mermaid Diagrams
 *
 * VitePress's .vp-doc applies typography styles (font-size, letter-spacing,
 * line-height, margin) that cascade into Mermaid's SVG foreignObject elements.
 * This causes text measurement (getBoundingClientRect) to return incorrect values,
 * resulting in node labels rendered as tiny dots.
 *
 * Fix: Reset all inherited CSS on the .mermaid container and its children
 * to break the cascade chain from .vp-doc styles.
 */

/* Reset inherited CSS cascade from VitePress .vp-doc */
.vp-doc .mermaid {
  all: initial !important;
  display: block !important;
  font-family: 'trebuchet ms', verdana, arial, sans-serif !important;
  font-size: 16px !important;
  letter-spacing: normal !important;
  line-height: normal !important;
  color: inherit !important;
  visibility: visible !important;
  margin: 16px 0 !important;
}

/* Ensure SVG renders responsively */
.vp-doc .mermaid svg {
  max-width: 100% !important;
  height: auto !important;
}

/* Block .vp-doc p/span/div styles from cascading into mermaid foreignObject */
.vp-doc .mermaid p,
.vp-doc .mermaid span,
.vp-doc .mermaid div,
.vp-doc .mermaid foreignObject p,
.vp-doc .mermaid foreignObject span,
.vp-doc .mermaid foreignObject div {
  margin: 0 !important;
  padding: 0 !important;
  line-height: normal !important;
  letter-spacing: normal !important;
  font-size: inherit !important;
}
</style>
