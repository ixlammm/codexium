"use strict";
// Build an unsigned (sideload) MSIX installer directly from the packaged Codex
// app using electron-windows-msix. This bypasses electron-forge (whose `pnpm
// install` fails because forge-project depends on a private monorepo's
// `workspace:*` packages) while still producing a real installable .msix.
//
//   node tooling/make-msix.cjs
// Env: MSIX_APP_DIR (default forge-project/out/Codex-win32-x64)
//      MSIX_OUT_DIR (default forge-project/out/installer)
//      APP_VERSION  (default from forge-project/package.json)

const path = require("path");
const fs = require("fs");

const REPO = path.join(__dirname, "..");
const APP = process.env.MSIX_APP_DIR || path.join(REPO, "forge-project", "out", "Codex-win32-x64");
const OUT = process.env.MSIX_OUT_DIR || path.join(REPO, "forge-project", "out", "installer");
const VER = process.env.APP_VERSION || require(path.join(REPO, "forge-project", "package.json")).version;

if (!fs.existsSync(path.join(APP, "Codex.exe"))) {
  console.error("[make-msix] packaged app not found at", APP, "— try the build step first");
  process.exit(1);
}

// Locate makeappx.exe from the Windows 10 SDK so electron-windows-msix can pack.
// Prefer an explicit WINDOWS_KIT_PATH; otherwise pick the newest x64 makeappx.
function findWindowsKit() {
  if (process.env.WINDOWS_KIT_PATH && fs.existsSync(process.env.WINDOWS_KIT_PATH)) return process.env.WINDOWS_KIT_PATH;
  const base = "C:\\Program Files (x86)\\Windows Kits\\10\\bin";
  if (!fs.existsSync(base)) return undefined;
  const dirs = [];
  for (const v of fs.readdirSync(base)) {
    const x64 = path.join(base, v, "x64");
    if (fs.existsSync(path.join(x64, "makeappx.exe"))) dirs.push(x64);
  }
  dirs.sort();
  return dirs[dirs.length - 1];
}
const windowsKitPath = findWindowsKit();
if (!windowsKitPath) console.warn("[make-msix] WARNING: no Windows SDK makeappx found — MSIX may fail");

const { packageMSIX } = require("electron-windows-msix");

(async () => {
  console.log("[make-msix] packaging", APP, "-> unsigned MSIX (windowsKit:", windowsKitPath || "auto", ")");
  await packageMSIX({
    appDir: APP,
    outputDir: OUT,
    packageName: "Codex",
    sign: false, // unsigned / sideload; no cert needed
    logLevel: "warn",
    createPri: false, // makepri chokes on the vendored cua_node payload; skip resource indexing
    windowsKitPath,
    manifestVariables: {
      packageIdentity: "OpenAI.Codex",
      publisher: "CN=OpenAI",
      publisherDisplayName: "OpenAI",
      packageVersion: `${VER}.0`,
      packageDisplayName: "Codex",
      packageDescription: "Codex",
      appExecutable: "Codex.exe",
      appDisplayName: "Codex",
      targetArch: "x64",
      packageMinOSVersion: "10.0.17763.0",
      packageMaxOSVersionTested: "10.0.22621.0",
    },
  });
  const files = fs.readdirSync(OUT).filter((f) => /\.msix/i.test(f));
  console.log("[make-msix] created:", files.join(", "), "in", OUT);
  if (!files.length) process.exit(1);
})().catch((e) => {
  console.error("[make-msix] ERROR:", (e && e.stack) || e);
  process.exit(1);
});
