const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const anchorOld =
  '"list-models-for-host":q9((e,{priority:t,source:n,timeoutMs:r,trace:i,...a})=>e.sendRequest(`model/list`,a,{priority:t,source:n,timeoutMs:r,trace:i}))';

const anchorNew =
  '"list-models-for-host":q9(async(e,{priority:t,source:n,timeoutMs:r,trace:i,...a})=>{let o=await e.sendRequest(`model/list`,a,{priority:t,source:n,timeoutMs:r,trace:i});let cm;try{cm=window.electronBridge?.getSharedObjectSnapshotValue?.("custom_models_catalog")??[]}catch(e){cm=[]}if(cm.length&&o&&Array.isArray(o.data))o.data=[...cm,...o.data];return o})';

const c = fs.readFileSync(f, "utf8");
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("renderer list-models-for-host anchor not found");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function("return ({" + anchorNew + "})");
} catch (e) {
  throw new Error("injected expression does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".model-list-rw", c);
fs.writeFileSync(f, patched);
console.log("renderer model/list response injection: OK");
console.log("new length", patched.length, "was", c.length);