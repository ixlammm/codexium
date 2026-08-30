<div align="center">

# Codexium

**A customized build of the Codex desktop app.**

Layering a model-grouping composer picker, a providers/models settings UI with
custom providers and models, live provider/model switching, and sign-in/auth
changes that don't force an OpenAI login — onto a pristine Codex install. Then
packaging it into installable Windows artifacts.

<p>
  <a href="https://github.com/ixlammm/codexium/actions/workflows/build-release.yml">
    <img alt="CI" src="https://github.com/ixlammm/codexium/actions/workflows/build-release.yml/badge.svg" />
  </a>
  <img alt="version" src="https://img.shields.io/badge/version-v26.803.41515-blue" />
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows-blue" />
  <a href="https://github.com/ixlammm/codexium/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/ixlammm/codexium" />
  </a>
</p>

</div>

---

## Highlights

Built with **privacy by default** — the built-in analytics, event logging, and
crash/error reporting (wham, `log_event`, SDK exceptions, Sentry) are blocked so
nothing sensitive leaves your machine.

| What | Why |
| --- | --- |
| **Model-grouping composer picker** | Group, filter, and switch models directly in the composer — no hunting through the menu. |
| **Custom providers & models** | Add and configure your own providers/models in a dedicated settings UI. |
| **Live provider/model switching** | Swap providers and models without relaunching the app. |
| **No forced OpenAI login** | Sign in / auth changes that don't force you into an OpenAI account. |
| **Telemetry removed** | The app's analytics and error reporters are blocked before they're sent. |

---

## Install

Installers are published to the GitHub release
(`gh release view v26.803.41515-patched`).

### Signed MSIX (recommended)

Download **`Codex-prod-x64.msix`** and **`Codex-prod-x64.cer`** (the certificate
that signed it). The package is signed with a self-signed CodeSigning cert
(subject `CN=OpenAI`), so trust that cert first — do **not** use `-AllowUnsigned`
(that path needs the unsigned namespace and fails).

MSIX validates the signature against a **Root** store, so the cert must be added to
`LocalMachine\Root` (run in an **elevated** PowerShell):

```powershell
# 1) Trust the dev cert as a trusted root (admin)
Import-Certificate -FilePath ".\Codex-prod-x64.cer" -CertStoreLocation Cert:\LocalMachine\Root

# 2) Install the signed MSIX (no -AllowUnsigned)
Add-AppxPackage -Path ".\Codex-prod-x64.msix"
```

Still refused? Enable **Settings → For developers → Developer Mode**, then re-run step 2.

### Portable zips (no installer)

- `Codex-prod-x64-app.zip` — patched CLI
- `Codex-dev-x64-app.zip` — dev CLI

Extract anywhere and run `Codex.exe`.

---

## Build from source

### Prerequisites

- Node.js (>= 18); install `tooling` deps:
  ```bash
  cd tooling && npm ci   # @electron/packager, @electron/asar
  ```
- A pristine base — either a prepared `app/` (an extracted `resources/app.asar`),
  or the original `resources/app.asar` at *`ASAR_SRC`*
  (default `C:/Users/Islam/Documents/projects/codex/resources/app.asar`).
- Native resources (`codex.exe`, `rg`, `native/`, `plugins/`, `skills/`,
  `cua_node/`) at *`NATIVE_RESOURCES`*
  (default `C:/Users/Islam/Documents/projects/codex/resources`).
- Electron `42.3.0` zip (auto-downloaded by electron-packager if not cached).

### Commands

From `tooling/`:

```bash
node rebuild.cjs            # check: fresh base + all patches, verified byte-identical
node rebuild.cjs --package  # check + run electron-packager into forge-project/out
node rebuild.cjs --rebuild  # full cycle: swap golden, package, extract unpacked app
```

Env overrides: `BASE_DIR`, `ASAR_SRC`, `NATIVE_RESOURCES`, `OUT_DIR`,
`FORGE_DIR`, `WORK_DIR`.

---

## Repo layout

```
tooling/rebuild.cjs        orchestrator (copy base → patch → verify → package → swap)
tooling/run-packager.cjs   electron-packager step
tooling/patch-*.cjs        delta recipes as byte-anchored rewrites
forge-project/             working copy: pristine base + patches (generated, untracked)
app/                       pristine base app source (untracked)
forge-project/out/         packaged output + unpacked app for fast iteration
```

`forge-project/` → generated. `app/` and `forge-project/out/` → untracked.
Tracked metadata lives in `forge-project/forge.config.cjs` + `forge-project/package.json`.

## Fast iteration loop

1. Edit `forge-project/out/Codex-win32-x64/resources/app/webview/index.html`
   (styles) or the bundle under `resources/app/webview/assets/`.
2. Close `Codex.exe`, relaunch from `forge-project/out/Codex-win32-x64/Codex.exe`.
3. When finished, run `node rebuild.cjs --rebuild` to lock the state and regenerate
   a clean distribution.

## Verification

A `--rebuild`/`--check` run asserts the patched files are byte-identical to the
current golden (the last shipped state). Drift in the base bundle, patch anchors,
or hand edits fails loudly instead of silently shipping something new.
