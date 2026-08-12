const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const old1 = "let k1=e.providerLabel??e.provider??null,rr=[];";
const new1 = "let k1=e.providerLabel??e.provider??(e.isCustom===!0?null:\"OpenAI\"),rr=[];";

const old2 = "let k1=e.providerLabel??e.provider??null;";
const new2 = "let k1=e.providerLabel??e.provider??(e.isCustom===!0?null:\"OpenAI\");";

const c = fs.readFileSync(f, "utf8");
let patched = c;
let replaced = 0;
for (const [o, n] of [
  [old1, new1],
  [old2, new2],
]) {
  if (patched.includes(o)) {
    patched = patched.split(o).join(n);
    replaced++;
  }
}
if (replaced !== 2) throw new Error("expected 2 grouping anchors, replaced " + replaced);

try {
  new Function(
    "return (function(){let k1=e.providerLabel??e.provider??(e.isCustom===!0?null:\"OpenAI\");return k1})",
  );
} catch (e) {
  throw new Error("injected expression does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".hdr", c);
fs.writeFileSync(f, patched);
console.log("renderer provider header fallback: OK");
console.log("new length", patched.length, "was", c.length);