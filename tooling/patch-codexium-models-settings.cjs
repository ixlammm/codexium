const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const ASSETS = path.join(ROOT, "webview", "assets");
const initialF = path.join(ASSETS, "app-initial-CUcIZsiK.js");
const visibleF = path.join(ASSETS, "use-visible-settings-sections-YMsl5Yxf.js");
const settingsPageF = path.join(ASSETS, "settings-page-BArsPhM9.js");
const searchDocsF = path.join(ASSETS, "_virtual_settings-search-documents-C1KdU2Si.js");

function apply(target, old, next, label) {
  const idx = target.indexOf(old);
  if (idx < 0) throw new Error("anchor not found: " + label);
  return target.slice(0, idx) + next + target.slice(idx + old.length);
}

// 0) Generate the icons module from @lobehub/icons-static-svg (the SVGs are
// reference-only; the register-aware generator lives in generate-codexium-icons.cjs).
try {
  require("./generate-codexium-icons.cjs");
} catch (e) {
  console.warn("icon generation failed (will fall back to missing icons):", e.message);
}
// Copy the icons module into the assets dir so the compiled UI kit and pages can
// import it at runtime alongside the other chunks.
fs.copyFileSync(path.join(__dirname, "codexium-icons.js"), path.join(ASSETS, "codexium-icons.js"));
console.log("icons module copied to assets: codexium-icons.js");
// Ship the provider registry as a resource too (the "local json inside resources").
// The Rust app-server still owns the canonical copy (compiled in + persisted in
// ~/.codex/codexium), but keeping it here makes the resource visible. We write
// to both the work-root resources dir (in case a consumer reads it from there)
// and the staged packager resource dir, which is what electron-packager copies.
fs.mkdirSync(path.join(ROOT, "resources"), { recursive: true });
fs.copyFileSync(path.join(__dirname, "providers-registry.json"), path.join(ROOT, "resources", "providers-registry.json"));
const nativeRes = process.env.NATIVE_RESOURCES || "C:/Users/Islam/Documents/projects/codex-rebuild/build/resources";
fs.mkdirSync(nativeRes, { recursive: true });
fs.copyFileSync(path.join(__dirname, "providers-registry.json"), path.join(nativeRes, "providers-registry.json"));
console.log("providers-registry.json copied to resources");

// 1) Compile the JSX sources into standalone ES module chunks using esbuild's
// JS API, then drop them next to the other assets. Order matters: the kit first,
// then the pages that import it.
const jsxFiles = [
  ["codexium-ui.jsx", "codexium-ui.js"],
  ["codexium-utils.jsx", "codexium-utils.js"],
  ["codexium-providers-settings.jsx", "codexium-providers-settings.js"],
  ["codexium-models-settings.jsx", "codexium-models-settings.js"],
];
let esbuild;
try {
  esbuild = require(require.resolve("esbuild", {
    paths: [__dirname, path.join(__dirname, ".."), path.join(__dirname, "..", ".."), path.join(process.env.APPDATA || "", "npm", "node_modules")],
  }));
} catch (e) {
  throw new Error("esbuild not found. Install it: npm i -g esbuild (or npm i esbuild in codex-rebuild)");
}
for (const [srcName, destName] of jsxFiles) {
  if (!fs.existsSync(path.join(__dirname, srcName))) continue;
  esbuild.buildSync({
    entryPoints: [path.join(__dirname, srcName)],
    bundle: false,
    format: "esm",
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "React.Fragment",
    outfile: path.join(ASSETS, destName),
    logLevel: "warning",
  });
  console.log("chunk compiled:", destName);
}

// ---- app-initial ----
let c = fs.readFileSync(initialF, "utf8");
const before = c;

// 1a) s9o master section list: add codexium-providers + codexium-models first.
c = apply(
  c,
  "s9o=[{slug:`general-settings`}",
  "s9o=[{slug:`codexium-providers`},{slug:`codexium-models`},{slug:`general-settings`}",
  "s9o list"
);

// 1b) s$c lazy page map: register both pages.
c = apply(
  c,
  '"general-settings":d1(',
  '"codexium-providers":d1(async()=>{let e=await import("./codexium-providers-settings.js");return e.CodexiumProvidersSettings}),"codexium-models":d1(async()=>{let e=await import("./codexium-models-settings.js");return e.CodexiumModelsSettings}),"general-settings":d1(',
  "s$c registration"
);

// 1c) h3s/g3s nav label map: add both labels.
const navLabels =
  '"codexium-providers":{id:`settings.nav.codexium-providers`,defaultMessage:`Providers`,description:`Codexium providers settings`},"codexium-models":{id:`settings.nav.codexium-models`,defaultMessage:`Models`,description:`Codexium models settings`},';
c = apply(
  c,
  '"general-settings":{id:`settings.nav.general-settings`',
  navLabels + '"general-settings":{id:`settings.nav.general-settings`',
  "h3s nav label"
);

// 1d) mkl RPC registry: register all codexium RPCs so the renderer can call them.
c = apply(
  c,
  '"write-skill-config":q9((e,t)=>e.sendRequest(`skills/config/write`,t))}}));',
  '"write-skill-config":q9((e,t)=>e.sendRequest(`skills/config/write`,t)),"codexium/models/read":q9((e,t)=>e.sendRequest(`codexium/models/read`,t)),"codexium/models/write":q9((e,t)=>e.sendRequest(`codexium/models/write`,t)),"codexium/registry/read":q9((e,t)=>e.sendRequest(`codexium/registry/read`,t)),"codexium/providers/connect":q9((e,t)=>e.sendRequest(`codexium/providers/connect`,t)),"codexium/providers/disconnect":q9((e,t)=>e.sendRequest(`codexium/providers/disconnect`,t)),"codexium/providers/check":q9((e,t)=>e.sendRequest(`codexium/providers/check`,t))}}));',
  "mkl RPC registry"
);

// 1e) Expose the React Query client on `window` so the codexium settings pages
// can invalidate the cached `["models","list",...]` queries after a provider or
// model change. This is what makes the chat composer's model picker refresh
// live (instead of only on relaunch).
c = apply(
  c,
  "function cAl(){let e=new tt(Gkl);",
  "function cAl(){let e=new tt(Gkl);window.__cxQueryClient=e;",
  "__cxQueryClient expose"
);

if (c === before) throw new Error("no changes applied to app-initial");
fs.writeFileSync(initialF + ".codexium", before);
fs.writeFileSync(initialF, c);
console.log("app-initial patched: OK (len", c.length, ")");

// ---- use-visible-settings-sections ----
let v = fs.readFileSync(visibleF, "utf8");
const vBefore = v;

// 2a) dt icon map: add both page slugs with custom Codexium icons. The icon
// components are defined inline (matching the module's `Z.jsx(s)` style) and
// referenced from the map. `e` spreads element props (e.g. className/size).
const codexiumNavIcons = [
  // Providers — a cloud/platter glyph (the user-supplied SVG).
  `(e)=>(0,Z.jsxs)(\`svg\`,{width:20,height:20,viewBox:\`0 0 20 20\`,fill:\`none\`,xmlns:\`http://www.w3.org/2000/svg\`,...e,children:[(0,Z.jsx)(\`path\`,{fillRule:\`evenodd\`,clipRule:\`evenodd\`,d:\`M10 2.66833C12.6997 2.66833 14.9892 4.45287 15.7422 6.90662C17.6505 7.31304 19.0811 9.00792 19.0811 11.0375C19.0811 13.3717 17.1889 15.2639 14.8547 15.2639H5.14531C2.81113 15.2639 0.918945 13.3717 0.918945 11.0375C0.918945 9.00792 2.34952 7.31304 4.25781 6.90662C5.01078 4.45287 7.30028 2.66833 10 2.66833ZM10 3.99841C7.75984 3.99841 5.89478 5.60789 5.50195 7.73376C5.44495 8.04217 5.18097 8.26991 4.86719 8.28162C3.41052 8.33602 2.24902 9.54752 2.24902 11.0375C2.24902 12.6372 3.54562 13.9338 5.14531 13.9338H14.8547C16.4544 13.9338 17.751 12.6372 17.751 11.0375C17.751 9.54752 16.5895 8.33602 15.1328 8.28162C14.819 8.26991 14.5551 8.04217 14.498 7.73376C14.1052 5.60789 12.2402 3.99841 10 3.99841Z\`,fill:\`currentColor\`})]})`,
  // Models — a stacked-layers glyph (the user-supplied SVG).
  `(e)=>(0,Z.jsxs)(\`svg\`,{width:20,height:20,viewBox:\`0 0 20 20\`,fill:\`none\`,xmlns:\`http://www.w3.org/2000/svg\`,...e,children:[(0,Z.jsx)(\`path\`,{fillRule:\`evenodd\`,clipRule:\`evenodd\`,d:\`M9.668 1.753C9.873 1.635 10.127 1.635 10.332 1.753L16.332 5.217C16.538 5.336 16.665 5.556 16.665 5.793V12.721C16.665 12.959 16.538 13.179 16.332 13.297L10.332 16.762C10.127 16.88 9.873 16.88 9.668 16.762L3.668 13.297C3.462 13.179 3.335 12.959 3.335 12.721V5.793C3.335 5.556 3.462 5.336 3.668 5.217L9.668 1.753ZM10 3.097L5.331 5.793L10 8.488L14.669 5.793L10 3.097ZM4.665 6.945V12.338L9.335 15.034V9.64L4.665 6.945ZM10.665 15.034L15.335 12.338V6.945L10.665 9.64V15.034Z\`,fill:\`currentColor\`})]})`,
];
v = apply(
  v,
  'dt={"general-settings":ze',
  'dt={"codexium-providers":' + codexiumNavIcons[0] + ',"codexium-models":' + codexiumNavIcons[1] + ',"general-settings":ze',
  "dt icon map"
);

// 2b) feature-gate map $: add both page slugs as codex.
v = apply(
  v,
  "$={",
  '$={"codexium-providers":`codex`,"codexium-models":`codex`,',
  "$ feature gate map"
);

// 2c) mt visibility switch: make both always visible.
v = apply(
  v,
  "case`general-settings`:case`agent`:case`personalization`:return!0;",
  "case`general-settings`:case`agent`:case`personalization`:case`codexium-providers`:case`codexium-models`:return!0;",
  "mt visibility switch"
);

if (v === vBefore) throw new Error("no changes applied to use-visible-settings-sections");
fs.writeFileSync(visibleF + ".codexium", vBefore);
fs.writeFileSync(visibleF, v);
console.log("use-visible-settings-sections patched: OK (len", v.length, ")");

// ---- settings-page ----
let p = fs.readFileSync(settingsPageF, "utf8");
const pBefore = p;

// 3a) _n order string: append both slugs at the end.
p = apply(
  p,
  "worktrees.browser-use.computer-use.data-controls`.split",
  "worktrees.browser-use.computer-use.data-controls.codexium-providers.codexium-models`.split",
  "_n order string"
);

// 3b) vn groups: add a Codexium group at the very end (after archived).
p = apply(
  p,
  "slugs:[`data-controls`]}],yn={",
  "slugs:[`data-controls`]},{key:`codexium`,heading:K({id:`settings.nav.heading.codexium`,defaultMessage:`Codexium`,description:`Heading for Codexium settings in the settings navigation`}),slugs:[`codexium-providers`,`codexium-models`]}],yn={",
  "vn codexium group at end"
);

if (p === pBefore) throw new Error("no changes applied to settings-page");
fs.writeFileSync(settingsPageF + ".codexium", pBefore);
fs.writeFileSync(settingsPageF, p);
console.log("settings-page patched: OK (len", p.length, ")");

// ---- _virtual_settings-search-documents ----
// The sidebar search only indexes sections that appear in this search-documents
// map. Add entries for the Codexium pages so they match "providers"/"models".
let sd = fs.readFileSync(searchDocsF, "utf8");
const sdBefore = sd;
const codexiumSearchDocs =
  'codexium-providers:[{defaultMessage:`Providers`,id:`settings.nav.codexium-providers`},{defaultMessage:`Connect custom model providers or use the built-in ones`,id:`settings.codexium.providers.description`},{defaultMessage:`API Key`,id:`settings.codexium.providers.apiKey`},{defaultMessage:`OAuth`,id:`settings.codexium.providers.oauth`},{defaultMessage:`Connect`,id:`settings.codexium.providers.connect`},{defaultMessage:`Disconnect`,id:`settings.codexium.providers.disconnect`}],codexium-models:[{defaultMessage:`Models`,id:`settings.nav.codexium-models`},{defaultMessage:`Enable, disable, and configure the models each provider exposes`,id:`settings.codexium.models.description`},{defaultMessage:`Search models`,id:`settings.codexium.models.search`},{defaultMessage:`Add model`,id:`settings.codexium.models.add`}],';
if (!sd.includes("codexium-providers:")) {
  sd = apply(sd, "t={agent:", "t={" + codexiumSearchDocs + "agent:", "settingsSearchDocuments codexium");
  fs.writeFileSync(searchDocsF + ".codexium", sdBefore);
  fs.writeFileSync(searchDocsF, sd);
  console.log("settingsSearchDocuments patched: OK (len", sd.length, ")");
} else {
  console.log("settingsSearchDocuments already patched");
}

console.log("ALL PATCHES OK");
