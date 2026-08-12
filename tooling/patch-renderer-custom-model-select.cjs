const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const anchorOld =
  "let c=await _m(`set-default-model-config-for-host`,{hostId:a,model:e,reasoningEffort:t,profile:p.profile});";

const anchorNew =
  "let c;try{c=await _m(`set-default-model-config-for-host`,{hostId:a,model:e,reasoningEffort:t,profile:p.profile})}catch(err){if(err?.code===-32600)throw err;c={status:`okOverridden`}}";

const c = fs.readFileSync(f, "utf8");
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("custom-model-select anchor not found in bundle");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function(
    "async function m(e,t){let i=null,o;try{let a=1,f=1,p={profile:{}},r=0,n=0,unused=1;" +
      anchorNew +
      ";if(unused)c=null}catch(e){}}",
  );
} catch (e) {
  throw new Error("injected expression does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".custom-model-select-rw", c);
fs.writeFileSync(f, patched);
console.log("renderer custom-model-select host-call swallow: OK");
console.log("new length", patched.length, "was", c.length);