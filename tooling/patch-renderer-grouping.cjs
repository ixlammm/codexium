const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const anchorOld =
  "h=p?.map(e=>(0,V2.jsx)(GVs,{keepOpenOnSelect:r,modelOption:e,selectedModel:d,selectedReasoningEffort:T,selectedServiceTier:I,selectedServiceTierIconKind:n?null:L,stripGptPrefix:n,onSelect:(e,t)=>{y(e,t),r||v?.()}},e.model))";

const anchorNew =
  "h=(()=>{let Gk=null;return p==null?[]:p.flatMap(e=>{let k1=e.providerLabel??e.provider??null,rr=[];if(k1&&k1!==Gk){rr.push((0,V2.jsx)(\"div\",{className:\"px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-token-text-secondary\",children:k1},k1));Gk=k1}rr.push((0,V2.jsx)(GVs,{keepOpenOnSelect:r,modelOption:e,selectedModel:d,selectedReasoningEffort:T,selectedServiceTier:I,selectedServiceTierIconKind:n?null:L,stripGptPrefix:n,onSelect:(e,t)=>{y(e,t),r||v?.()}},e.model));return rr})})()";

const c = fs.readFileSync(f, "utf8");
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("WVs model rows anchor not found");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function("return (" + anchorNew + ")");
} catch (e) {
  throw new Error("injected expression does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".model-rows", c);
fs.writeFileSync(f, patched);
console.log("renderer WVs grouping: OK");
console.log("new length", patched.length, "was", c.length);