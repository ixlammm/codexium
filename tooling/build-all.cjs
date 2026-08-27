"use strict";
// Full build: build the codexium-cli binary, then build the patched Codex app.
//
//   node tooling/build-all.cjs           # check only (patch + verify)
//   node tooling/build-all.cjs --rebuild # build cli (cargo) + full app rebuild
//   node tooling/build-all.cjs --package # build cli + package
//
// Precedence for the codex binary:
//   1. $env:LOCAL_CODEX_EXE (already provided)
//   2. build the submodule (codexium-cli/codex-rs) via cargo
// Then it hands off to the existing build launcher (tooling/build.cjs).

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO = path.join(__dirname, "..");
const CLI = path.join(REPO, "codexium-cli", "codex-rs");
const EXE = path.join(CLI, "target", "debug", "codex.exe");
const isWin = process.platform === "win32";

function buildCli() {
  console.log("[build-all] building codexium-cli (cargo)...");
  const r = spawnSync("cargo", ["build", "--bin", "codex", "-p", "codex-cli"], {
    cwd: CLI,
    stdio: "inherit",
    env: { ...process.env },
  });
  if (r.status !== 0) throw new Error("codexium-cli build failed (status " + r.status + ")");
  if (!fs.existsSync(EXE)) throw new Error("codex.exe was not produced by the cli build");
  console.log("[build-all] codex.exe ->", EXE);
}

if (!process.env.LOCAL_CODEX_EXE) {
  if (!fs.existsSync(EXE)) {
    if (!os.userInfo) { /* noop */ }
    // fall back to the sibling dev checkout if the submodule isn't built
    const sibling = path.join(REPO, "..", "codexium-cli", "codex-rs", "target", "debug", "codex.exe");
    if (fs.existsSync(sibling)) {
      process.env.LOCAL_CODEX_EXE = sibling;
      console.log("[build-all] using sibling codex.exe ->", sibling);
    } else {
      if (!fs.existsSync(path.join(CLI, "Cargo.toml"))) {
        throw new Error("codexium-cli submodule not cloned (run: git submodule update --init)");
      }
      buildCli();
      process.env.LOCAL_CODEX_EXE = EXE;
    }
  } else {
    process.env.LOCAL_CODEX_EXE = EXE;
  }
}
console.log("[build-all] LOCAL_CODEX_EXE =", process.env.LOCAL_CODEX_EXE);

// Hand off to the real build launcher (auto-resolves ELECTRON_ZIP_DIR, runs the
// requested mode against tooling/rebuild.cjs).
require("./build.cjs");
