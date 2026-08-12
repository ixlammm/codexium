const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const anchorOld =
  "function nQr({additionalAvailableModels:e,authMethod:t,availableModels:n,model:r,useHiddenModels:i}){return e?.has(r.model)===!0||(i&&t!==`amazonBedrock`?n.has(r.model):!r.hidden)}";

// Allow catalog rows (isCustom) through the availability filter used by the
// composer model picker (TF -> hQr -> tQr -> nQr).
const anchorNew =
  "function nQr({additionalAvailableModels:e,authMethod:t,availableModels:n,model:r,useHiddenModels:i}){return r.isCustom===!0||e?.has(r.model)===!0||(i&&t!==`amazonBedrock`?n.has(r.model):!r.hidden)}";

const c = fs.readFileSync(f, "utf8");
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("nQr anchor not found");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function("return (" + anchorNew + ")");
} catch (e) {
  throw new Error("injected expression does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".tqr", c);
fs.writeFileSync(f, patched);
console.log("renderer tQr/nQr availability filter: OK");
console.log("new length", patched.length, "was", c.length);