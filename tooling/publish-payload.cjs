"use strict";
// Pack the base Codex app payload into a VERSIONED zip so it can be published as
// a GitHub release asset and downloaded by CI. Example output:
//
//   codex-app-v26.803.41515-payload.zip   (contains webview/ + package.json)
//
// Usage:
//   node tooling/publish-payload.cjs            # write the zip into ./release
//   node tooling/publish-payload.cjs --upload   # also `gh release create/upload`
//
// The zip mirrors the local `app/` dir (minus node_modules + .vite), so unpacking
// it into a directory makes that directory a valid BASE_DIR for the build.

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const APP = path.join(REPO, "app");
const VENDOR = path.join(REPO, "vendor");
const OUT_DIR = path.join(REPO, "release");
const SKIP = new Set(["node_modules", ".vite", ".git"]);

const version = require(path.join(APP, "package.json")).version;
const zipName = `codex-app-v${version}-payload.zip`;
const zipPath = path.join(OUT_DIR, zipName);

function walk(dir, base, zip, skip) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    const rel = path.join(base, e.name).split(path.sep).join("/");
    if (e.isDirectory()) walk(abs, rel, zip, skip);
    else zip.addFile(rel, fs.readFileSync(abs));
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const zip = new AdmZip();
// app/ -> zip/app/... include the WHOLE app (webview + .vite/build + node_modules
// + package.json) — the build patches .vite/build/main-*.js and packages the app
// with its deps. The only thing NOT committed is the downloadable node runtime
// (node.exe), which lives under vendor/cua-node and is fetched at build time.
walk(APP, "app", zip, new Set([".git"]));
// vendor/ -> zip/vendor/... keep EVERYTHING, including cua-node/bin/node_modules
// (those are the cua runtime modules the build needs, not reinstallable).
walk(VENDOR, "vendor", zip, new Set([".git"]));
zip.writeZip(zipPath);

const mb = fs.statSync(zipPath).size / 1048576;
console.log("[publish-payload] app version:", version);
console.log("[publish-payload] wrote", path.relative(REPO, zipPath), "(" + mb.toFixed(1) + " MB) [app/ + vendor/]");

if (process.argv.includes("--upload")) {
  const release = process.env.PAYLOAD_RELEASE || "codex-app-payload";
  console.log("[publish-payload] uploading to release", release, "...");
  try {
    execFileSync("gh", ["release", "view", release], { stdio: "ignore" });
  } catch {
    console.log("[publish-payload] creating release", release);
    execFileSync("gh", ["release", "create", release, "--title", "Codex app payloads", "--notes", "Versioned base Codex app payloads for codex-rebuild. Assets are codex-app-v<payload-version>-payload.zip"], { stdio: "inherit" });
  }
  execFileSync("gh", ["release", "upload", release, zipPath, "--clobber"], { stdio: "inherit" });
  console.log("[publish-payload] uploaded", zipName, "to release", release);
}
