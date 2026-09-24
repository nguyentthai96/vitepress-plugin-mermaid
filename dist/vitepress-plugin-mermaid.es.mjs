//#region src/mermaid-markdown.ts
var e = (e, t) => {
	let n = e.renderer.rules.fence.bind(e.renderer.rules);
	e.renderer.rules.fence = (e, r, i, a, o) => {
		let s = e[r];
		if (s.info.trim() === "mermaid") try {
			return `
      <Suspense> 
      <template #default>
      <Mermaid id="mermaid-${r}" class="${t?.class || "mermaid"}" graph="${encodeURIComponent(s.content)}"></Mermaid>
      </template>
        <!-- loading state via #fallback slot -->
        <template #fallback>
          Loading...
        </template>
      </Suspense>`;
		} catch (e) {
			return `<pre>${e}</pre>`;
		}
		return s.info.trim() === "mmd" && (e[r].info = "mermaid"), n(e, r, i, a, o);
	};
}, t = {
	securityLevel: "loose",
	startOnLoad: !1
};
function n(e) {
	let n = {
		...t,
		...e
	}, r = "virtual:mermaid-config", i = "\0" + r;
	return {
		name: "vite-plugin-mermaid",
		enforce: "post",
		transform(e, t) {
			if (t.includes("vitepress/dist/client/app/index.js")) {
				e = "\nimport Mermaid from 'vitepress-plugin-mermaid/Mermaid.vue';\n" + e;
				let t = e.split("\n"), n = t.findIndex((e) => e.includes("app.component"));
				return t.splice(n, 0, "  app.component(\"Mermaid\", Mermaid);"), e = t.join("\n"), {
					code: e,
					map: null
				};
			}
		},
		async resolveId(e) {
			if (e === r) return i;
		},
		async load(e) {
			if (e === i) return `export default ${JSON.stringify(n)};`;
		}
	};
}
//#endregion
//#region src/index.ts
var r = (t) => {
	t.markdown ||= {};
	let r = t.markdown.config || (() => {});
	t.markdown.config = (...n) => {
		e(...n, t.mermaidPlugin), r(...n);
	}, t.vite ||= {}, t.vite.plugins || (t.vite.plugins = []), t.vite.plugins.push(n(t.mermaid)), t.vite.optimizeDeps || (t.vite.optimizeDeps = {}), t.vite.optimizeDeps.include || (t.vite.optimizeDeps.include = []), t.vite.optimizeDeps.include = [
		...t.vite.optimizeDeps.include,
		"mermaid",
		"@braintree/sanitize-url",
		"dayjs",
		"cytoscape-cose-bilkent",
		"cytoscape",
		"elkjs"
	], t.vite.resolve || (t.vite.resolve = {});
	let i = {
		"dayjs/plugin/advancedFormat.js": "dayjs/esm/plugin/advancedFormat",
		"dayjs/plugin/customParseFormat.js": "dayjs/esm/plugin/customParseFormat",
		"dayjs/plugin/isoWeek.js": "dayjs/esm/plugin/isoWeek",
		"cytoscape/dist/cytoscape.umd.js": "cytoscape/dist/cytoscape.esm.js"
	};
	return t.vite.resolve.alias ? Array.isArray(t.vite.resolve.alias) ? t.vite.resolve.alias = [...t.vite.resolve.alias, ...Object.entries(i).map(([e, t]) => ({
		find: e,
		replacement: t
	}))] : t.vite.resolve.alias = {
		...t.vite.resolve.alias,
		...i
	} : t.vite.resolve.alias = i, t.vite.ssr || (t.vite.ssr = {}), t.vite.ssr.noExternal || (t.vite.ssr.noExternal = []), Array.isArray(t.vite.ssr.noExternal) && t.vite.ssr.noExternal.push("mermaid"), t;
};
//#endregion
export { e as MermaidMarkdown, n as MermaidPlugin, r as withMermaid };
