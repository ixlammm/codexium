const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// When the user is authenticated via an API key (not a ChatGPT account), the
// built-in OpenAI models are unusable, so don't offer them. The picker's include
// predicate `nQr` already gates custom models by `hidden`; extend it so that in
// `apikey` auth mode, non-custom (OpenAI) models are excluded entirely.
const anchor =
  "return r.isCustom===!0?!r.hidden:(e?.has(r.model)===!0||(i&&t!==`amazonBedrock`?n.has(r.model):!r.hidden))";
const replacement =
  "return r.isCustom===!0?!r.hidden:(t===`apikey`?false:(e?.has(r.model)===!0||(i&&t!==`amazonBedrock`?n.has(r.model):!r.hidden)))";

if (!c.includes(anchor)) throw new Error("nQr predicate anchor not found");
const patched = c.split(anchor).join(replacement);

fs.writeFileSync(f + ".hideopenai", c);
fs.writeFileSync(f, patched);
console.log("renderer hide OpenAI in API-key mode: OK");
console.log("new length", patched.length, "was", c.length);
