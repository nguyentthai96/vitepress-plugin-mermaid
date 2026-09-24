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

/**
 * Inject a global CSS reset that targets mermaid's temporary measurement
 * containers BEFORE they are created.
 *
 * Mermaid renders by creating temporary <div> elements in document.body
 * to measure text via getBoundingClientRect(). If VitePress .vp-doc CSS
 * (e.g. `.vp-doc p { margin: 16px; line-height: 1.8 }`) cascades into
 * these temp elements, text measurement returns wrong values.
 *
 * This stylesheet resets ALL <p>, <span>, <div> inside any element with
 * id starting with "d" (mermaid's sandbox pattern) and inside .mermaid.
 */
const injectMermaidResetCSS = () => {
  if (document.getElementById('mermaid-css-reset')) return;
  const style = document.createElement('style');
  style.id = 'mermaid-css-reset';
  style.textContent = `
    /* Reset mermaid sandbox measurement containers */
    [id^="d"] p, [id^="d"] span, [id^="d"] div,
    [id^="d"] foreignObject p, [id^="d"] foreignObject span,
    .mermaid p, .mermaid span, .mermaid div,
    .mermaid foreignObject p, .mermaid foreignObject span {
      margin: 0 !important;
      padding: 0 !important;
      line-height: normal !important;
      letter-spacing: normal !important;
      font-size: 16px !important;
    }

    /* Reset the mermaid container itself */
    .vp-doc .mermaid {
      font-size: 16px !important;
      letter-spacing: normal !important;
      line-height: normal !important;
    }

    /* Ensure SVG renders responsively */
    .vp-doc .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }
  `;
  document.head.prepend(style);
};

onMounted(async () => {
  // Inject CSS reset BEFORE mermaid renders
  injectMermaidResetCSS();

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
