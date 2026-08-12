const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, ".vite", "build", "src-Cz_uUmVl.js");

const anchorOld =
  'if(n.error)throw Error(n.error.message??`Failed to read available models`);return n.result';

const anchorNew =
  'if(n.error)throw Error(n.error.message??`Failed to read available models`);let _cm=(typeof globalThis!=="undefined"&&globalThis.__custom_models_catalog)||[];if(_cm.length&&n.result&&Array.isArray(n.result.data))n.result.data=[..._cm,...n.result.data];return n.result';

const c = fs.readFileSync(f, "utf8");
const idx = c.indexOf(anchorOld);
if (idx < 0) throw new Error("model/list anchor not found");
const patched = c.slice(0, idx) + anchorNew + c.slice(idx + anchorOld.length);

try {
  new Function(patched);
} catch (e) {
  throw new Error("patched file does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".model-list", c);
fs.writeFileSync(f, patched);
console.log("src-Cz_uUmVl.js model/list injection: OK");
console.log("new length", patched.length, "was", c.length);