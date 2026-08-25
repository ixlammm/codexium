const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const replacements = [
  [
    "function U1r(e,t){return t==null?e:{...e,model:t.model,reasoningEffort:t.reasoningEffort,profile:t.profile}}",
    "function U1r(e,t){return t==null?e:{...e,model:t.model,modelProvider:t.modelProvider??null,reasoningEffort:t.reasoningEffort,profile:t.profile}}",
  ],
  [
    "o={model:t,reasoningEffort:r};n.set(SF,i,o)",
    "o={model:t,modelProvider:(window.electronBridge?.getSharedObjectSnapshotValue?.(\"custom_models_catalog\")??[]).find(x=>x.model===t)?.provider??null,reasoningEffort:r};n.set(SF,i,o)",
  ],
  [
    "let c;try{c=await _m(`set-default-model-config-for-host`,{hostId:a,model:e,reasoningEffort:t,profile:p.profile})}catch(err){if(err?.code===-32600)throw err;c={status:`okOverridden`}}",
    "let mp=(window.electronBridge?.getSharedObjectSnapshotValue?.(\"custom_models_catalog\")??[]).find(x=>x.model===e)?.provider??null;let c;try{c=await _m(`set-default-model-config-for-host`,{hostId:a,model:e,modelProvider:mp,reasoningEffort:t,profile:p.profile})}catch(err){if(err?.code===-32600)throw err;c={status:`okOverridden`}}",
  ],
  [
    "n.set(snr,s,{model:e,reasoningEffort:t,profile:p.profile})",
    "n.set(snr,s,{model:e,modelProvider:(window.electronBridge?.getSharedObjectSnapshotValue?.(\"custom_models_catalog\")??[]).find(x=>x.model===e)?.provider??null,reasoningEffort:t,profile:p.profile})",
  ],
  [
    "modelSettings:{model:e,profile:o.modelSettings.profile,reasoningEffort:t}",
    "modelSettings:{model:e,modelProvider:(window.electronBridge?.getSharedObjectSnapshotValue?.(\"custom_models_catalog\")??[]).find(x=>x.model===e)?.provider??null,profile:o.modelSettings.profile,reasoningEffort:t}",
  ],
  [
    "return NZr(n,i,{model:t,modelProvider:mp,reasoningEffort:r},()=>M(t,r))",
    "return NZr(n,i,{model:t,modelProvider:mp,reasoningEffort:r},()=>M(t,r))",
  ],
];

const c = fs.readFileSync(f, "utf8");
if (c.includes("modelProvider:t.modelProvider??null")) {
  console.log("renderer custom provider persistence: already patched");
  process.exit(0);
}
let patched = c;
for (const [from, to] of replacements) {
  const idx = patched.indexOf(from);
  if (idx < 0) throw new Error("custom provider persistence anchor not found: " + from.slice(0, 120));
  patched = patched.slice(0, idx) + to + patched.slice(idx + from.length);
}

try {
  new Function("return ({" + replacements.map(([, to]) => "x:" + JSON.stringify(to)).join(",") + "})");
} catch (e) {
  throw new Error("injected expressions do not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".custom-provider-persist", c);
fs.writeFileSync(f, patched);
console.log("renderer custom provider persistence: OK");
console.log("new length", patched.length, "was", c.length);
