const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const anchorOld = "queryFn:()=>e.get(tP).models(),queryKey:[`chatgpt-models`]";

const anchorNew =
  'queryFn:async()=>{const _r=e.get(tP).models();let _m=[];try{_m=window.electronBridge?.getSharedObjectSnapshotValue?.("custom_models_feed")??[];}catch{_m=[];}if(_m.length){const _d=await _r;return{..._d,models:[...(_d.models??[]),..._m]};}return _r;},queryKey:[`chatgpt-models`]';

const c = fs.readFileSync(f, "utf8");
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("renderer chatgpt-models queryFn anchor not found");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function("return ({placeholderData:MLr," + anchorNew + ",staleTime:ym.FIVE_MINUTES})");
} catch (e) {
  throw new Error("injected CUi queryFn does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".custom-feed", c);
fs.writeFileSync(f, patched);
console.log("renderer chatgpt-models custom_models_feed injection: OK");
console.log("new length", patched.length, "was", c.length);