const fs = require("fs");
const path = require("path");

// The packager is resolved from the repo's own node_modules (run-packager.cjs
// lives in tooling/ and require('@electron/packager') walks up to
// <repo>/node_modules). Its dist/unzip.js uses `extract-zip`, which hangs on
// Node 24 for large archives like the electron 144MB zip. Replace the
// implementation with `adm-zip` (pure JS, cross-platform).
const REPO = path.join(__dirname, "..");
const unzipJs = path.join(REPO, "node_modules", "@electron", "packager", "dist", "unzip.js");

const patched = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractElectronZip = void 0;
const AdmZip = require("adm-zip");
async function extractElectronZip(zipPath, targetDir) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetDir, /*overwrite*/ true);
}
exports.extractElectronZip = extractElectronZip;
`;

if (!fs.existsSync(unzipJs)) {
  console.log("[patch-packager-unzip] @electron/packager not installed yet; skipping (run npm install first)");
  process.exit(0);
}

const current = fs.readFileSync(unzipJs, "utf8");
if (current.includes("adm-zip")) {
  console.log("packager unzip already patched");
  process.exit(0);
}

fs.writeFileSync(unzipJs, patched);
console.log("packager unzip.js patched -> adm-zip");
