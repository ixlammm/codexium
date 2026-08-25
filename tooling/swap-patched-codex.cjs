"use strict";
/*
 * swap-patched-codex.cjs
 *
 * Overwrites build/resources/codex.exe (staged by prepare-resources.cjs from a
 * pinned upstream release) with a locally patched debug build produced by
 * `cargo build --bin codex -p codex-cli`.
 *
 * Enable with the LOCAL_CODEX_EXE env var; otherwise the upstream pinned binary
 * is left in place.
 *
 *   set LOCAL_CODEX_EXE=C:\Users\Islam\Documents\projects\codex-cli\codex-rs\target\debug\codex.exe
 *   node tooling\rebuild.cjs --rebuild
 */

const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const NATIVE_RES = process.env.NATIVE_RESOURCES || path.join(REPO, "build", "resources");
const SOURCE = process.env.LOCAL_CODEX_EXE;

if (!SOURCE) {
  console.log("[swap-patched-codex] LOCAL_CODEX_EXE not set, skipping");
  process.exit(0);
}
if (!fs.existsSync(SOURCE)) {
  throw new Error(`[swap-patched-codex] LOCAL_CODEX_EXE does not exist: ${SOURCE}`);
}
const dest = path.join(NATIVE_RES, "codex.exe");
if (!fs.existsSync(path.dirname(dest))) {
  throw new Error(`[swap-patched-codex] resources dir missing: ${path.dirname(dest)}`);
}
const bak = dest + ".upstream.bak";
if (fs.existsSync(dest) && !fs.existsSync(bak)) {
  fs.copyFileSync(dest, bak);
  console.log("[swap-patched-codex] backed up upstream codex.exe");
}
fs.copyFileSync(SOURCE, dest);
const stat = fs.statSync(dest);
console.log(`[swap-patched-codex] ${SOURCE} -> ${dest} (${stat.size} bytes)`);
