"use strict";
/*
 * patch-natives.cjs
 *
 * Replace native modules that ship in the extracted Codex app.asar with
 * ABI-stable N-API upstream packages. This avoids the "specified module
 * could not be found" failure where the legacy .node imports chrome.dll /
 * libnode.dll separately, neither of which are present in electron-packager
 * output (electron.exe is monolithic in Electron 42).
 *
 * Prebuilts are pulled from npm tarballs hosted on registry.npmjs.org
 * and pinned in pins.json. They are sha256-verified against the manifest.
 */

const { createHash } = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { execFileSync } = require("child_process");

const TOOLING = __dirname;
const REPO = path.join(TOOLING, "..");
const PINS = require(path.join(TOOLING, "pins.json"));
const WORK = process.env.FORGE_ROOT || path.join(REPO, "forge-project");

const NATIVES = [
  {
    name: "better-sqlite3",
    version: "13.0.3",
    file: "prebuilds/win32-x64.node",
    installDir: "node_modules/better-sqlite3",
    binPath: "build/Release/better_sqlite3.node",
    replacePackage: true,
  },
  {
    name: "node-pty",
    version: "1.1.0",
    file: "win32-x64.node",
    installDir: "node_modules/node-pty",
    binPath: "build/Release/pty.node",
  },
];

function sha256(p) {
  return createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function fetchTarball(name, version, pin) {
  const url = `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;
  const cache = path.join(TOOLING, "_natives_cache");
  fs.mkdirSync(cache, { recursive: true });
  const file = path.join(cache, `${name}-${version}.tgz`);
  if (!fs.existsSync(file) || fs.statSync(file).size <= 1024 * 1024) {
    console.log(`[natives] fetch ${name}@${version}`);
    execFileSync("curl.exe", ["-L", "--fail", "--retry", "3", "-o", file, url], {
      stdio: "inherit",
    });
  }
  if (pin.tgzSha256) {
    const got = sha256(file);
    if (got !== pin.tgzSha256) {
      fs.rmSync(file, { force: true });
      throw new Error(`tarball sha256 mismatch for ${name}@${version}\n  expected ${pin.tgzSha256}\n  got      ${got}`);
    }
  }
  return file;
}

function extractTarball(tgz, into) {
  fs.mkdirSync(into, { recursive: true });
  const tmp = path.join(path.dirname(into), `__extract_${path.basename(into)}`);
  rm(tmp);
  fs.mkdirSync(tmp, { recursive: true });
  execFileSync("tar.exe", ["-xzf", tgz, "-C", tmp], { stdio: "inherit" });
  for (const entry of fs.readdirSync(path.join(tmp, "package"))) {
    const src = path.join(tmp, "package", entry);
    const dst = path.join(into, entry);
    if (fs.statSync(src).isDirectory()) {
      rm(dst);
      fs.cpSync(src, dst, { recursive: true });
    } else {
      fs.copyFileSync(src, dst);
    }
  }
  rm(tmp);
}

function rm(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function findBin(dir, want) {
  const normalizedWant = want.replace(/\\/g, path.sep).replace(/\//g, path.sep);
  const direct = path.join(dir, normalizedWant);
  if (fs.existsSync(direct)) return direct;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    if (!fs.existsSync(cur)) continue;
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === path.basename(want)) return p;
    }
  }
  return null;
}

function main() {
  if (!PINS.natives) {
    console.log("[natives] no pins.natives entry; skipping");
    return;
  }
  for (const n of NATIVES) {
    const pin = PINS.natives[n.name];
    if (!pin) {
      console.log(`[natives] no pin for ${n.name}; skipping`);
      continue;
    }
    if (pin.version !== n.version) {
      console.log(`[natives] pin version mismatch for ${n.name}: want ${n.version}, pin ${pin.version}`);
    }
    const target = path.join(WORK, n.installDir);
    const targetBin = path.join(target, n.binPath);
    const targetPkg = path.join(target, "package.json");
    if (
      fs.existsSync(targetBin) &&
      sha256(targetBin) === pin.sha256 &&
      (!n.replacePackage || require(targetPkg).version === n.version)
    ) {
      console.log(`[natives] ${n.name}/${n.file} already verified`);
      continue;
    }
    const cacheDir = path.join(TOOLING, "_natives_extract", n.name);
    rm(cacheDir);
    const tgz = fetchTarball(n.name, n.version, pin);
    extractTarball(tgz, cacheDir);
    const srcBin = findBin(cacheDir, n.file);
    if (!srcBin) throw new Error(`could not find ${n.file} in ${n.name}@${n.version}`);
    const got = sha256(srcBin);
    if (got !== pin.sha256) {
      rm(cacheDir);
      throw new Error(`sha256 mismatch for ${n.name}/${n.file}\n  expected ${pin.sha256}\n  got      ${got}`);
    }
    if (n.replacePackage) {
      rm(target);
      fs.cpSync(cacheDir, target, { recursive: true });
    }
    fs.mkdirSync(path.dirname(targetBin), { recursive: true });
    fs.copyFileSync(path.join(target, n.file), targetBin);
    console.log(`[natives] ${n.name}@${n.version} -> ${target}`);
    rm(cacheDir);
  }
}

main();
