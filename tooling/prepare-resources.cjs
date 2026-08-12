"use strict";
/*
 * prepare-resources.cjs
 *
 * Assembles a complete NATIVE_RESOURCES stage (the `resources\` payload that is
 * copied into the packaged app) from two sources:
 *
 *   1. vendor/   - proprietary payload committed to the repo (cua node_modules,
 *                  native addons, plugins, skills, icons, config, notices)
 *   2. download  - pinned public artifacts fetched + sha256-verified at build
 *                  time (Node runtime, codex binaries, ripgrep)
 *
 * Output : build/resources/  (gitignored). Point NATIVE_RESOURCES there.
 */

const { createHash } = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const VENDOR = path.join(REPO, "vendor");
const BUILD = path.join(REPO, "build");
const CACHE = path.join(BUILD, "_cache");
const OUT = path.join(BUILD, "resources");

const PINS = require(path.join(__dirname, "pins.json"));

function sha256File(file) {
  const h = createHash("sha256");
  const b = fs.readFileSync(file);
  h.update(b);
  return h.digest("hex");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rm(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function download(url, dest, sha256, size) {
  if (fs.existsSync(dest) && sha256File(dest) === sha256) {
    console.log(`[cache] ${path.basename(dest)} already verified`);
    return dest;
  }
  ensureDir(path.dirname(dest));
  console.log(`[fetch] ${url}`);
  execFileSync("curl.exe", ["-L", "--fail", "--retry", "3", "-o", dest, url], {
    stdio: "inherit",
  });
  const got = sha256File(dest);
  if (got !== sha256) {
    fs.rmSync(dest, { force: true });
    throw new Error(
      `sha256 mismatch for ${path.basename(dest)}\n  expected ${sha256}\n  got      ${got}`
    );
  }
  if (size && fs.statSync(dest).size !== size) {
    throw new Error(
      `size mismatch for ${path.basename(dest)}: expected ${size}, got ${fs.statSync(dest).size}`
    );
  }
  console.log(`[ok]   ${path.basename(dest)} (${fs.statSync(dest).size} bytes, sha256 verified)`);
  return dest;
}

function untar(archive, into) {
  ensureDir(into);
  rm(into);
  ensureDir(into);
  console.log(`[extract] ${path.basename(archive)} -> ${into}`);
  execFileSync("tar.exe", ["-xf", archive, "-C", into], { stdio: "inherit" });
}

function findFile(dir, want) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === want) return p;
    }
  }
  return null;
}

// For archives whose inner filename doesn't match the desired target (e.g.
// "codex-x86_64-unknown-linux-musl" inside the tarball should be staged as
// "codex"), return the first file found in the tree.
function firstFile(dir) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else return p;
    }
  }
  return null;
}

function copyTree(src, dst, opts = {}) {
  ensureDir(dst);
  if (opts.wipe && fs.existsSync(dst)) rm(dst);
  ensureDir(dst);
  fs.cpSync(src, dst, { recursive: true });
  console.log(`[copy] ${path.relative(VENDOR, src)} -> build/resources/${path.relative(OUT, dst) || "."}`);
}

function main() {
  ensureDir(CACHE);
  rm(OUT);
  ensureDir(OUT);

  const codexBase = PINS.codexRelease.baseUrl;

  // ---- windows codex binaries (plain copy) ----
  for (const a of PINS.codexRelease.copyAssets) {
    const dl = download(
      `${codexBase}/${a.name}`,
      path.join(CACHE, a.name),
      a.sha256,
      a.size
    );
    fs.copyFileSync(dl, path.join(OUT, a.to));
    console.log(`[stage] ${a.name} -> resources/${a.to}`);
  }

  // ---- linux (musl) codex binaries (extract from tar.gz) ----
  for (const a of PINS.codexRelease.extractAssets) {
    const dl = download(
      `${codexBase}/${a.name}`,
      path.join(CACHE, a.name),
      a.sha256
    );
    const stage = path.join(BUILD, "_tmp", a.name.replace(/\.tar\.gz$/, ""));
    untar(dl, stage);
    const found = firstFile(stage);
    if (!found) throw new Error(`no files in ${a.name}`);
    fs.copyFileSync(found, path.join(OUT, a.to));
    console.log(`[stage] ${a.name} -> resources/${a.to} (${fs.statSync(found).size} bytes)`);
  }

  // ---- node runtime ----
  const nodeZip = download(
    PINS.nodeRuntime.url,
    path.join(CACHE, PINS.nodeRuntime.file),
    PINS.nodeRuntime.sha256
  );
  const nodeStage = path.join(BUILD, "_tmp", "node-dist");
  untar(nodeZip, nodeStage);
  const nodeExe = findFile(nodeStage, "node.exe");
  if (!nodeExe) throw new Error("node.exe not found in node distribution");
  const nodeRoot = path.dirname(nodeExe);
  const nodeBin = path.join(OUT, "cua_node", "bin");
  ensureDir(nodeBin);
  for (const e of fs.readdirSync(nodeRoot, { withFileTypes: true })) {
    const src = path.join(nodeRoot, e.name);
    const dst = path.join(nodeBin, e.name);
    if (e.isDirectory()) fs.cpSync(src, dst, { recursive: true });
    else fs.copyFileSync(src, dst);
  }
  console.log("[stage] node runtime -> resources/cua_node/bin");

  // ---- ripgrep ----
  const rgZip = download(
    PINS.ripgrep.windowsZip.url,
    path.join(CACHE, PINS.ripgrep.windowsZip.name),
    PINS.ripgrep.windowsZip.sha256
  );
  const rgStage = path.join(BUILD, "_tmp", "rg-win");
  untar(rgZip, rgStage);
  const rgExe = findFile(rgStage, "rg.exe");
  if (!rgExe) throw new Error("rg.exe not found in ripgrep windows zip");
  fs.copyFileSync(rgExe, path.join(OUT, PINS.ripgrep.windowsZip.to));

  const rgTar = download(
    PINS.ripgrep.linuxTarGz.url,
    path.join(CACHE, PINS.ripgrep.linuxTarGz.name),
    PINS.ripgrep.linuxTarGz.sha256
  );
  const rgLinuxStage = path.join(BUILD, "_tmp", "rg-linux");
  untar(rgTar, rgLinuxStage);
  const rgBin = findFile(rgLinuxStage, "rg") || firstFile(rgLinuxStage);
  if (!rgBin) throw new Error("rg not found in ripgrep linux tar.gz");
  fs.copyFileSync(rgBin, path.join(OUT, PINS.ripgrep.linuxTarGz.to));
  console.log("[stage] ripgrep 15.2.0 -> resources/rg.exe + resources/rg");

  // ---- vendored payload ----
  copyTree(path.join(VENDOR, "assets"), OUT);
  copyTree(path.join(VENDOR, "native"), path.join(OUT, "native"));
  copyTree(path.join(VENDOR, "plugins"), path.join(OUT, "plugins"));
  copyTree(path.join(VENDOR, "skills"), path.join(OUT, "skills"));
  copyTree(
    path.join(VENDOR, "cua-node", "bin", "node_modules"),
    path.join(nodeBin, "node_modules"),
    { wipe: true }
  );
  fs.copyFileSync(
    path.join(VENDOR, "cua-node", "bin", "node_repl.exe"),
    path.join(nodeBin, "node_repl.exe")
  );
  fs.copyFileSync(
    path.join(VENDOR, "cua-node", "manifest.json"),
    path.join(OUT, "cua_node", "manifest.json")
  );
  console.log("[stage] vendored cua-node node_modules + node_repl.exe + manifest.json");

  // keep extract scratch but drop stage dirs (cache persists)
  rm(path.join(BUILD, "_tmp"));

  // ---- summary ----
  const total = fs
    .readdirSync(OUT, { withFileTypes: true })
    .reduce((acc, e) => {
      const p = path.join(OUT, e.name);
      if (e.isDirectory()) {
        return (
          acc +
          (fs.readdirSync(p, { recursive: true }).reduce((a, f) => {
            const fp = path.join(p, f);
            return a + (fs.statSync(fp).isFile() ? fs.statSync(fp).size : 0);
          }, 0) || 0)
        );
      }
      return acc + fs.statSync(p).size;
    }, 0);
  console.log("\n[done] staged resources:", OUT);
  console.log(`       ${(total / 1024 / 1024).toFixed(1)} MB across ${fs
    .readdirSync(OUT, { recursive: true })
    .filter((f) => fs.statSync(path.join(OUT, f)).isFile()).length} files`);
}

main();