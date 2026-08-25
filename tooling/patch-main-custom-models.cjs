const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, ".vite", "build", "main-9TSQ_KaE.js");
const injPath = path.join(__dirname, "injected-custom-models.js");

const c = fs.readFileSync(f, "utf8");
if (c.includes("__custom_models_catalog")) {
  console.log("main custom model config injector: already present");
  process.exit(0);
}

const inj = fs.readFileSync(injPath, "utf8").trim();
const anchor = "this.sharedObjectRepository.set(`local_remote_control_installation_id`,e.appGlobalState.get(r.T));let t=n.it();";
const idx = c.indexOf(anchor);
if (idx < 0) throw new Error("main custom model injector anchor not found");

const splicePoint = idx + anchor.indexOf("let t=n.it();");
const patched = c.slice(0, splicePoint) + inj + ";" + c.slice(splicePoint);

try {
  new Function(patched);
} catch (e) {
  throw new Error("patched main bundle does not parse: " + e.message.slice(0, 200));
}

fs.writeFileSync(f + ".custom-models", c);
fs.writeFileSync(f, patched);
console.log("main custom model config injector: OK");
console.log("new length", patched.length, "was", c.length);
