"use strict";
// Ensure the base Codex app payload is present and version-matched.
//
//   1. Uses the local `app/` if it already holds the expected version.
//   2. Otherwise downloads `codex-app-v<EXPECTED>-payload.zip` from the
//      `codex-app-payload` GitHub release and unpacks it into `app/`.
//   3. FAILS (exit 1) if it can't find/download/unpack it.
//
// The expected version is the Codex app build the tooling is pinned to. Override
// with APP_VERSION. Usage: node tooling/fetch-payload.cjs  (or: npm run fetch:payload)

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const APP = path.join(REPO, "app");
const TMP = path.join(REPO, ".payload-dl");

const PINNED_VERSION = "26.803.41515";
const EXPECTED = process.env.APP_VERSION || PINNED_VERSION;
const RELEASE = process.env.PAYLOAD_RELEASE || "codex-app-payload";
const REPO_SLUG = process.env.GITHUB_REPOSITORY || "ixlammm/codexium";
const ASSET = `codex-app-v${EXPECTED}-payload.zip`;

function fail(msg) { console.error("[fetch-payload] ERROR: " + msg); process.exit(1); }
function download(url, out) {
  return new Promise((resolve) => {
    function grab(u) {
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { grab(res.headers.location); return; }
        if (res.statusCode !== 200) { console.error("[fetch-payload] HTTP " + res.statusCode + " for " + u); resolve(false); return; }
        const f = fs.createWriteStream(out); res.pipe(f);
        f.on("finish", () => resolve(true));
        f.on("error", () => resolve(false));
      }).on("error", () => resolve(false));
    }
    grab(url);
  });
}

(async () => {
  // 1) local payload already matching?
  if (fs.existsSync(path.join(APP, "package.json"))) {
    const local = require(path.join(APP, "package.json")).version;
    if (local === EXPECTED) {
      console.log("[fetch-payload] using local app/ payload v" + local + " (matches expected)");
      process.exit(0);
    }
    console.log("[fetch-payload] local app/ is v" + local + " != expected v" + EXPECTED + " — will download the expected one");
  }

  // 2) download from the release
  fs.rmSync(APP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const dl = path.join(TMP, ASSET);
  const url = `https://github.com/${REPO_SLUG}/releases/download/${RELEASE}/${ASSET}`;
  console.log("[fetch-payload] downloading", url);
  const ok = await download(url, dl);
  if (!ok || !fs.existsSync(dl)) {
    fail(`could not download ${ASSET} — is it uploaded to release '${RELEASE}' on ${REPO_SLUG}? run: npm run publish:payload:upload`);
  }

  // 3) unpack into app/
  console.log("[fetch-payload] unpacking", ASSET);
  fs.rmSync(APP, { recursive: true, force: true });
  fs.mkdirSync(APP, { recursive: true });
  execFileSync("powershell", ["-NoProfile", "-Command", `Expand-Archive -Path "${dl}" -DestinationPath "${APP}" -Force`], { stdio: "inherit" });
  fs.rmSync(TMP, { recursive: true, force: true });

  const v = require(path.join(APP, "package.json")).version;
  console.log("[fetch-payload] app/ payload ready (v" + v + ")");
  process.exit(v === EXPECTED ? 0 : 1);
})();
