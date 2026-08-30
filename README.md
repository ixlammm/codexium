# Codexium

A customized build of the Codex desktop app. It layers additional features onto a
pristine Codex install — a model-grouping composer picker, a providers/models
settings UI with custom providers and models, live provider/model switching, and
sign-in/auth changes that don't force an OpenAI login — then packages and
publishes installable Windows artifacts (signed MSIX + portable zips).

## Layout

- `tooling/rebuild.cjs` — orchestrator (copy base → apply patches → verify →
  package → swap → unpacked dev dir)
- `tooling/run-packager.cjs` — electron-packager step (uses `@electron/packager`)
- `tooling/patch-*.cjs` — the actual delta recipes as byte-anchored rewrites;
  each targets `$FORGE_ROOT` (defaults to `../forge-project`)
- `forge-project/forge.config.cjs`, `forge-project/package.json` — build metadata
  (tracked; everything else under `forge-project/` is generated)
- `forge-project/` (untracked) — the working copy: pristine base + patches;
  its `webview/index.html`, `app-initial-CUcIZsiK.js`, `.vite/build/src-Cz_uUmVl.js`
  and the worklouder bundle are the "golden" that a verified build must match
- `app/` (untracked) — pristine base app source (matching `resources/app.asar`)
- `forge-project/out/` (untracked) — packaged output: `out/Codex-win32-x64/`
  `resources/app` is the unpacked app you edit + relaunch for fast iteration

## Prerequisites

- Node.js (>= 18) and `tooling/node_modules` installed:
  `cd tooling && npm ci` (deps: `@electron/packager`, `@electron/asar`)
- A pristine base. Either:
  - `app/` prepared (an extracted `resources/app.asar`), or
  - the original `resources/app.asar` at `ASAR_SRC`
    (default `C:/Users/Islam/Documents/projects/codex/resources/app.asar`)
- Native resources (codex.exe, rg, native/, plugins/, skills/, cua_node/)
  at `NATIVE_RESOURCES`
  (default `C:/Users/Islam/Documents/projects/codex/resources`)
- Electron 42.3.0 zip (auto-downloaded by electron-packager if not cached)

## Usage

From `tooling/`:

```
node rebuild.cjs            # check: fresh copy of base + all patches, verified
                            #   byte-identical to the shipped golden files
node rebuild.cjs --package  # check + run electron-packager into forge-project/out
node rebuild.cjs --rebuild  # full cycle: swap golden, package, extract unpacked
                            #   resources/app, rename app.asar -> app.asar.bak
```

Env overrides: `BASE_DIR`, `ASAR_SRC`, `NATIVE_RESOURCES`, `OUT_DIR`,
`FORGE_DIR`, `WORK_DIR`.

## Install (release)

Installers are published to the GitHub release
(`gh release view v26.803.41515-patched`). Two kinds of asset exist:

### Signed MSIX (recommended, installer)

Download `Codex-prod-x64.msix` **and** `Codex-prod-x64.cer` (the dev certificate
used to sign it). The package is signed with a self-signed CodeSigning cert
(subject `CN=OpenAI`), so you must trust that cert first — do **not** use
`-AllowUnsigned` (that path needs the "unsigned namespace" and fails).

```powershell
# 1) Trust the dev cert
Import-Certificate -FilePath "Codex-prod-x64.cer" -CertStoreLocation Cert:\CurrentUser\TrustedPeople

# 2) Install the signed MSIX (no -AllowUnsigned)
Add-AppxPackage -Path "Codex-prod-x64.msix"
```

If Windows still refuses, enable **Settings → For developers → Developer Mode**
(for sideloaded packages), then re-run step 2.

### Portable zips (no installer)

`Codex-prod-x64-app.zip` (patched CLI) / `Codex-dev-x64-app.zip` (dev CLI):
extract anywhere and run `Codex.exe`.

## Fast iteration loop (after a build)

1. Edit `forge-project/out/Codex-win32-x64/resources/app/webview/index.html`
   (styles) or the bundle under `resources/app/webview/assets/`
2. Close `Codex.exe`, relaunch from
   `forge-project/out/Codex-win32-x64/Codex.exe`
3. When finished, run `node rebuild.cjs --rebuild` to lock the final state and
   regenerate a clean distribution

## Verification

A `--rebuild`/`--check` run asserts the patched files are byte-identical to the
current golden (the last shipped state). Any drift in the base bundle, patch
anchors, or hand edits fails loudly instead of silently shipping something new.