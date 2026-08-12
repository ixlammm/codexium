const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const anchorOld =
  "options:p?.map(e=>({id:e.model,label:(0,V2.jsx)(u0,{model:e.model,displayName:e.displayName,stripGptPrefix:!0}),onSelect:()=>{y(e.model,e.supportedReasoningEfforts.find(e=>{let{reasoningEffort:t}=e;return t===T})?.reasoningEffort??e.defaultReasoningEffort)},selected:e.model===d}))??[]";

const anchorNew =
  "options:(()=>{if(p==null)return[];let Gk=null,ar=[];for(const e of p){let k1=e.providerLabel??e.provider??null;if(k1&&k1!==Gk){ar.push({id:`hdr-`+k1,label:(0,V2.jsx)(\"div\",{className:\"px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-token-text-secondary\",children:k1}),onSelect:()=>{},selected:!1});Gk=k1}ar.push({id:e.model,label:(0,V2.jsx)(u0,{model:e.model,displayName:e.displayName,stripGptPrefix:!0}),onSelect:()=>{y(e.model,e.supportedReasoningEfforts.find(e=>{let{reasoningEffort:t}=e;return t===T})?.reasoningEffort??e.defaultReasoningEffort)},selected:e.model===d})}return ar})()";

const c = fs.readFileSync(f, "utf8");
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("G.model.options anchor not found");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function("return ({" + anchorNew + "})");
} catch (e) {
  throw new Error("injected expression does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".gopt", c);
fs.writeFileSync(f, patched);
console.log("renderer advanced model options grouped by provider: OK");
console.log("new length", patched.length, "was", c.length);