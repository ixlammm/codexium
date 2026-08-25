"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TOOLING = __dirname;
const REPO = path.join(__dirname, "..");
const FORGE = process.env.FORGE_DIR || path.join(REPO, "forge-project");
const BASE_DIR = process.env.BASE_DIR || path.join(REPO, "app");
const NATIVE_RES_STAGED = path.join(REPO, "build", "resources");
const ASAR_SRC = process.env.ASAR_SRC || "C:/Users/Islam/Documents/projects/codex/resources/app.asar";
const NATIVE_RES = process.env.NATIVE_RESOURCES || NATIVE_RES_STAGED;
const OUT_DIR = process.env.OUT_DIR || path.join(FORGE, "out");
const WORK = process.env.WORK_DIR || path.join(os.tmpdir(), "codex-rebuild-work");

const MODE = process.argv.includes("--rebuild")
  ? "rebuild"
  : process.argv.includes("--package")
    ? "package"
    : "check";

const PATCHES = [
  "patch-renderer-grouping.cjs",
  "patch-renderer-group-options.cjs",
  "patch-renderer-headers-fallback.cjs",
  "patch-renderer-model-list.cjs",
  "patch-renderer-custom-feed.cjs",
  "patch-renderer-tqr.cjs",
  "patch-renderer-custom-model-select.cjs",
  "patch-renderer-custom-provider-select.cjs",
  "patch-renderer-custom-provider-persist.cjs",
  "patch-model-group-styling.cjs",
  "patch-model-picker-search.cjs",
  "patch-model-hidden-fix.cjs",
  "patch-auth-access.cjs",
  "patch-hide-openai-apikey.cjs",
  "patch-cx-login-route.cjs",
  "patch-main-custom-models.cjs",
  "patch-src-model-list.cjs",
  "patch-wl-bundle.cjs",
  "patch-remote-debug.cjs",
  "patch-natives.cjs",
  "patch-codexium-models-settings.cjs",
  "patch-packager-unzip.cjs",
  "swap-patched-codex.cjs",
];

const PATCH_JUNK_RE = /\.(gsty|model-rows|gopt|hdr|model-list-rw|custom-feed|tqr|custom-model-select-rw|custom-provider-select|custom-provider-persist|custom-models|upstream\.bak|codexium)$|\.model-list$/;

const VERIFY_FILES = [
  "webview/index.html",
  "webview/assets/app-initial-CUcIZsiK.js",
  ".vite/build/src-Cz_uUmVl.js",
  "node_modules/@worklouder/device-kit-oai/node_modules/@worklouder/wl-device-kit/dist/index.js",
];

function rm(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function ensureStagedResources() {
  if (process.env.NATIVE_RESOURCES) return;
  if (fs.existsSync(NATIVE_RES_STAGED)) return;
  console.log("[resources] build/resources missing -> running prepare-resources.cjs");
  execFileSync(
    process.execPath,
    [path.join(TOOLING, "prepare-resources.cjs")],
    { cwd: TOOLING, stdio: "inherit" }
  );
}
ensureStagedResources();

function acquireBase() {
  const indexPath = path.join(BASE_DIR, "webview", "index.html");
  if (fs.existsSync(indexPath)) {
    console.log("[base] using prepared base:", BASE_DIR);
    return BASE_DIR;
  }
  if (fs.existsSync(ASAR_SRC)) {
    const asar = require("@electron/asar");
    rm(BASE_DIR);
    fs.mkdirSync(BASE_DIR, { recursive: true });
    console.log("[base] extracting", ASAR_SRC);
    asar.extractAll(ASAR_SRC, BASE_DIR);
    return BASE_DIR;
  }
  fs.rmSync(ASAR_SRC, { force: true });
  throw new Error("no base app found (set BASE_DIR or ASAR_SRC)");
}

function prepareWork(base) {
  rm(WORK);
  fs.mkdirSync(WORK, { recursive: true });
  console.log("[work] copying base ->", WORK);
  fs.cpSync(base, WORK, { recursive: true });
  const fc = path.join(FORGE, "forge.config.cjs");
  if (fs.existsSync(fc)) fs.copyFileSync(fc, path.join(WORK, "forge.config.cjs"));
  const pkg = path.join(FORGE, "package.json");
  if (fs.existsSync(pkg)) fs.copyFileSync(pkg, path.join(WORK, "package.json"));
}

function runNode(script, extraEnv, cwd) {
  execFileSync(process.execPath, [script], {
    cwd: cwd || TOOLING,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
  });
}

function applyPatches() {
  for (const p of PATCHES) {
    console.log("[patch]", p);
    runNode(path.join(TOOLING, p), { FORGE_ROOT: WORK });
  }
  const stack = [path.join(WORK, "webview", "assets"), path.join(WORK, ".vite", "build")];
  let removed = 0;
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (PATCH_JUNK_RE.test(e.name)) {
        fs.unlinkSync(p);
        removed++;
      }
    }
  }
  if (removed) console.log("[clean] removed", removed, "patch backup files");
}

function verify() {
  const missing = [];
  const mismatch = [];
  for (const rel of VERIFY_FILES) {
    const a = path.join(WORK, rel);
    const b = path.join(FORGE, rel);
    if (!fs.existsSync(a) || !fs.existsSync(b)) {
      missing.push(rel);
      continue;
    }
    if (!fs.readFileSync(a).equals(fs.readFileSync(b))) mismatch.push(rel);
  }
  const stubRel = "node_modules/@worklouder/device-kit-oai/node_modules/node-hid/stub-index.js.serialport";
  const sa = path.join(WORK, stubRel);
  const sb = path.join(FORGE, stubRel);
  if (!fs.existsSync(sa) || !fs.existsSync(sb)) missing.push(stubRel + " (stub)");
  else if (!fs.readFileSync(sa).equals(fs.readFileSync(sb))) mismatch.push(stubRel + " (stub)");

  if (mismatch.length) {
    if (MODE === "rebuild") {
      console.log("[verify] golden mismatch accepted for rebuild:\n  " + mismatch.join("\n  "));
      return;
    }
    throw new Error("VERIFY FAILED (patched != shipped golden):\n  " + mismatch.join("\n  "));
  }
  if (missing.length) {
    console.log("[verify] skipped (no golden yet, fresh clone?):\n  " + missing.join("\n  "));
    return;
  }
  console.log("[verify] patched files byte-match shipped golden (" + VERIFY_FILES.length + "+stub)");
}

function packageApp() {
  console.log("[package] running electron-packager");
  // After swap() in rebuild mode the work copy has been renamed to FORGE;
  // without swap (package-only mode) the work copy is still at WORK. Pick
  // whichever path currently exists so electron-packager finds package.json.
  const appDir = fs.existsSync(WORK) ? WORK : FORGE;
  runNode(path.join(TOOLING, "run-packager.cjs"), {
    FORGE_ROOT: appDir,
    NATIVE_RESOURCES: NATIVE_RES,
    OUT_DIR,
    FORGE_DIR: FORGE,
  });
}

function extractDevApp() {
  const res = path.join(OUT_DIR, "Codex-win32-x64", "resources");
  const asarFile = path.join(res, "app.asar");
  const asar = require("@electron/asar");
  const appDir = path.join(res, "app");
  console.log("[dev] extracting", asarFile, "->", appDir);
  rm(appDir);
  asar.extractAll(asarFile, appDir);
  const bak = path.join(res, "app.asar.bak");
  fs.rmSync(bak, { force: true });
  fs.renameSync(asarFile, bak);
  console.log("[dev] app.asar -> app.asar.bak (unpacked app dir in use)");
}

function swap() {
  console.log("[swap] replacing", FORGE);
  rm(FORGE);
  fs.mkdirSync(path.dirname(FORGE), { recursive: true });
  fs.renameSync(WORK, FORGE);
}

const baseUsed = acquireBase();
baseUsed && prepareWork(baseUsed);
applyPatches();
verify();

if (MODE === "check") {
  console.log("\nCHECK OK — patched work copy at:", WORK);
  process.exit(0);
}

if (MODE === "rebuild") {
  swap();
  packageApp();
  extractDevApp();
  console.log("\nREBUILD OK — new build at", path.join(OUT_DIR, "Codex-win32-x64"));
} else {
  packageApp();
  console.log("\nPACKAGE OK — see", path.join(OUT_DIR, "Codex-win32-x64"));
}
