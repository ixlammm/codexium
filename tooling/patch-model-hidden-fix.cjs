const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// The model-picker inclusion predicate `nQr` returns a model from the picker
// list. For CUSTOM (codexium) models it returned `isCustom === true` with no
// respect for the `hidden` flag, so disabling a custom model or deleting a
// whole custom provider left its models visible in the chat picker (they only
// disappeared on relaunch). Make custom models respect `hidden` the same way
// built-in models do.
const anchor =
  "return r.isCustom===!0||e?.has(r.model)===!0||(i&&t!==`amazonBedrock`?n.has(r.model):!r.hidden)";
const replacement =
  "return r.isCustom===!0?!r.hidden:(e?.has(r.model)===!0||(i&&t!==`amazonBedrock`?n.has(r.model):!r.hidden))";

if (!c.includes(anchor)) throw new Error("nQr predicate anchor not found");
const patched = c.split(anchor).join(replacement);

fs.writeFileSync(f + ".hiddenfix", c);
fs.writeFileSync(f, patched);
console.log("renderer model picker hidden-custom fix: OK");
console.log("new length", patched.length, "was", c.length);
