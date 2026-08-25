const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const anchorOld =
  "return NZr(n,i,{model:t,reasoningEffort:r},()=>M(t,r))";

const anchorNew =
  "let mp=null;try{mp=(window.electronBridge?.getSharedObjectSnapshotValue?.(\"custom_models_catalog\")??[]).find(x=>x.model===t)?.provider??null}catch{}return NZr(n,i,{model:t,modelProvider:mp,reasoningEffort:r},()=>M(t,r))";

const c = fs.readFileSync(f, "utf8");
if (c.includes(anchorNew)) {
  console.log("renderer custom provider selection: already patched");
  process.exit(0);
}
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("custom provider selection anchor not found");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function("return (()=>{" + anchorNew + "})");
} catch (e) {
  throw new Error("injected expression does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".custom-provider-select", c);
fs.writeFileSync(f, patched);
console.log("renderer custom provider selection: OK");
console.log("new length", patched.length, "was", c.length);
