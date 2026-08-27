"use strict";
// Cross-platform launcher for the codex-rebuild pipeline.
//
// Wraps tooling/rebuild.cjs and auto-resolves two machine-specific env vars so
// you can just run `npm run rebuild` without setting them by hand:
//
//   LOCAL_CODEX_EXE   -> path to the debug `codex.exe` built from codexium-cli
//                        (used by swap-patched-codex.cjs to swap in the binary)
//   ELECTRON_ZIP_DIR  -> electron Cache dir holding the offline electron zip
//                        (used by run-packager.cjs so it never hits the network)
//
// Any env var you set yourself still takes precedence. Pass the mode through:
//   node tooling/build.cjs            # check   (patch + verify only)
//   node tooling/build.cjs --rebuild  # rebuild (patch + swap + package)
//   node tooling/build.cjs --package  # package (package only)

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function findCodexExe() {
  const cands = [
    process.env.LOCAL_CODEX_EXE,
    path.join(__dirname, "codexium-cli", "codex-rs", "target", "debug", "codex.exe"),
    path.join(__dirname, "..", "..", "codexium-cli", "codex-rs", "target", "debug", "codex.exe"),
    path.join(os.homedir(), "Documents", "projects", "codexium-cli", "codex-rs", "target", "debug", "codex.exe"),
  ].filter(Boolean);
  return cands.find((p) => fs.existsSync(p)) || "";
}

function findElectronZipDir() {
  if (process.env.ELECTRON_ZIP_DIR) return process.env.ELECTRON_ZIP_DIR;
  const cache = path.join(os.homedir(), "AppData", "Local", "electron", "Cache");
  try {
    const dirs = fs.readdirSync(cache, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(cache, d.name));
    // Prefer the newest (by mtime). Fall back to the first.
    dirs.sort((a, b) => (fs.statSync(b).mtimeMs || 0) - (fs.statSync(a).mtimeMs || 0));
    return dirs[0] || "";
  } catch {
    return "";
  }
}

const env = { ...process.env };
if (!env.LOCAL_CODEX_EXE) env.LOCAL_CODEX_EXE = findCodexExe();
if (!env.ELECTRON_ZIP_DIR) env.ELECTRON_ZIP_DIR = findElectronZipDir();

if (env.LOCAL_CODEX_EXE) console.log("[build] LOCAL_CODEX_EXE =", env.LOCAL_CODEX_EXE);
else console.warn("[build] WARNING: LOCAL_CODEX_EXE not found (codex.exe) — the package step may fail");
if (env.ELECTRON_ZIP_DIR) console.log("[build] ELECTRON_ZIP_DIR =", env.ELECTRON_ZIP_DIR);
else console.warn("[build] WARNING: ELECTRON_ZIP_DIR not found — packager may hit the network");

const args = process.argv.slice(2);
console.log("[build] running tooling/rebuild.cjs", args.join(" ") || "(check mode)");
const r = spawn(process.execPath, [path.join(__dirname, "rebuild.cjs"), ...args], {
  stdio: "inherit",
  env,
  cwd: __dirname,
});
r.on("error", (e) => { console.error("[build] failed to spawn:", e.message); process.exit(1); });
r.on("exit", (code) => process.exit(code == null ? 1 : code));
