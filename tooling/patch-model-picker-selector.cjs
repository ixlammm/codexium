const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// Replace the whole `triggerButton` value — the `$h` wrapper (which carried the
// "Select model" tooltip + its own layout) and its `dh` button child — with a
// bare CxSelector. This removes the tooltip and the wrapper's inline layout, so
// the 3 buttons take a normal line and can open their own dropdowns.
// We extract the balanced `(0,U2.jsx)($h,{...})` expression that follows
// `triggerButton:` and swap it for `(0,U2.jsx)(CxSelector,{})`.
function balancedStr(src, start) {
  // src[start] is the opening `(` of a JSX factory call like `(0,U2.jsx)(...)`.
  // Consume the first parenthesized group, then any DIRECTLY following call
  // groups `(args...)` so we capture the whole `(0,U2.jsx)(model,{...})`.
  let i = start;
  function group(j) {
    let depth = 0, k = j;
    for (; k < src.length; k++) {
      if (src[k] === "(") depth++;
      else if (src[k] === ")") { depth--; if (depth === 0) { k++; return k; } }
    }
    return k;
  }
  i = group(start);                       // end of `(0,U2.jsx)`
  while (i < src.length && src[i] === "(") {   // one or more call arg groups
    i = group(i);
  }
  return src.slice(start, i);
}
const tbMarker = 'triggerButton:(0,U2.jsx)($h,{';
const tbStart = c.indexOf(tbMarker);
if (tbStart < 0) throw new Error("triggerButton $h marker not found");
const callStart = c.indexOf("(", tbStart + "triggerButton:".length);
const labelAnchor = balancedStr(c, callStart);
const labelReplacement = '(0,U2.jsx)(CxSelector,{})';

// Compile codexium-composer-selector.jsx -> function bodies. The source reuses
// the bundle's own `U2` (jsx) and `Wo` (hooks) bindings, so we inject the
// compiled JS (cxh shim + CxSelector) straight into the module scope and
// reference CxSelector from the trigger. We read the compiled text from esbuild
// output, so no template-literal escaping issues (the old String.raw approach
// was fragile).
const esbuild = require(require.resolve("esbuild", {
  paths: [
    __dirname,
    path.join(__dirname, ".."),
    path.join(__dirname, "..", ".."),
    path.join(process.env.APPDATA || "", "npm", "node_modules"),
  ],
}));
const jsxSrc = fs.readFileSync(path.join(__dirname, "codexium-composer-selector.jsx"), "utf8");
let compDef = esbuild.transformSync(jsxSrc, {
  loader: "jsx",
  jsx: "transform",
  jsxFactory: "cxh",
  jsxFragment: "cxf",
  format: "esm",
}).code;
// esbuild emits `export function CxSelector();` — strip the export keyword so the
// injected declarations live in the bundle's module scope (where `U2`/`Wo` are).
compDef = compDef.replace(/^export\s+function/m, "function").replace(/^export\{.*?};?\s*$/m, "");
compDef = compDef.replace(/\nexport\s*\{[^}]*\};\s*$/m, "");

const topAnchor = "function h(e){setTi";
let patched = c;
if (patched.indexOf(labelAnchor) < 0) throw new Error("trigger label anchor not found");
const iTop = patched.indexOf(topAnchor);
if (iTop < 0) throw new Error("module-top anchor not found");
patched = patched.slice(0, iTop) + "\n" + compDef + "\n" + patched.slice(iTop);
patched = patched.split(labelAnchor).join(labelReplacement);

fs.writeFileSync(f + ".cxselect", c);
fs.writeFileSync(f, patched);
console.log("renderer model-picker 3-button selector: OK");
console.log("new length", patched.length, "was", c.length);
