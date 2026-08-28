# Changelog

All notable changes to this project are documented here.

The project wraps the official Codex desktop app (the "base payload") with a
byte-exact patch pipeline and a set of "Codexium" customizations (custom
providers/models, settings pages, auth changes, telemetry removal), and ships it
via an automated GitHub Actions build + release for **Codexium-cli**.

## [26.803.41515-patched] — current

### Build & repackaging (base kit)
- Byte-exact patch pipeline that applies a list of `patch-*.cjs` transforms to the
  unpacked base Codex app in a temp work copy, then swaps and packages it.
- `rebuild.cjs`: prepares resources (fetches Node, codex binaries, ripgrep; stages
  the vendored payload), applies patches, verifies, swaps WORK -> forge-project,
  and packages with `@electron/packager` (Electron 42.3.0, offline zip support).
- `run-packager.cjs`: electron-packager (win32/x64, asar, extraResources, icon).
- `prepare-resources.cjs`: fetches the Node runtime + codex binaries + ripgrep and
  stages `vendor/` (cua-node, plugins, assets, native, skills) into `build/resources`.
- `patch-natives.cjs`: places pinned native modules (better-sqlite3, node-pty).

### Codexium custom settings & providers
- **Providers settings page**: connected + "popular" catalog, All/API Key/OAuth
  tabs, search, connect/disconnect, per-provider status checks ("Recheck all"),
  custom provider add form.
- **Models settings page**: search, collapsible per-provider groups, add/remove/edit
  models with token/context inputs, hide-empty-on-filter, toasts.
- **Live model/provider updates** (no relaunch): `apply_codexium_visibility` now
  fully re-syncs the chat model list — add/delete/rename/disable reflect
  immediately; the settings pages invalidate the model-list query after a write.
- **Provider registry** refreshed (v1.1.0): DeepSeek V4, Kimi K3/K2.7/K2.6, Qwen3.7,
  Zhipu GLM-5.x, MiniMax M3, Gemini 3.x, Anthropic Claude, Groq gpt-oss,
  OpenRouter, Ollama.
- **Model picker fixes**: hidden custom models are excluded (delete/disable a
  provider's model now hides it), and built-in OpenAI models are hidden when
  authenticated via API key.

### Auth / sign-in
- **No forced OpenAI login**: API-key/PAT users keep full app access (the app no
  longer gates on ChatGPT auth when using custom providers).
- **"Sign in with ChatGPT"** appears in the profile menu (and is the first item)
  whenever not in a ChatGPT/Copilot account.
- The sign-in action routes to the login page via an unconditional **`/cx-login`**
  route (the app's setup/auth guard hid `/login` when a model was configured).
- **"Go back"** button on the sign-in page (react-router `navigate('/')`).

### Privacy / telemetry
- **Renderer telemetry neutered**: a blocker injected into the renderer bundle
  swallows `fetch`/`XHR`/`sendBeacon` calls to analytics endpoints
  (`/wham/analytics-events`, `/log_event`, `/sdk_exception`, sentry). Blocked calls
  return `200` with a recognizable `X-Codex-Telemetry: blocked` header, so you can
  verify nothing phoning home.

### Build scripts & automation
- **npm scripts**: `check`, `rebuild`, `package`, `build:all` (build cli + app),
  `build:cli`, `publish:payload`, `publish:payload:upload`, `fetch:payload`,
  `check:payload`, `prepare:resources`.
- **`codexium-cli` git submodule** (private repo, pinned commit).
- **`build-all.cjs`**: builds the codexium-cli binary then the app.
- **Versioned payload**: `publish-payload.cjs` zips `app/ + vendor/` into
  `codex-app-v<version>-payload.zip` and uploads it to the `codex-app-payload`
  GitHub release; `fetch-payload.cjs` uses the local `app/` if it matches the
  pinned version, otherwise downloads the versioned payload (or fails loudly).
- **GitHub Actions workflow** (`.github/workflows/build-release.yml`): on a `v*` tag
  (or manual dispatch / `full-build` push) it installs deps, fetches the payload,
  downloads the latest codexium-cli release binary, builds the **prod** and **dev**
  apps (matrix), and publishes both as release assets on the tag.

### Fixes along the way
- Dropped invalid/private action refs; GH_TOKEN for private-release downloads.
- `WORK_DIR` on the same drive as the repo (fix `EXDEV` on swap).
- `NATIVE_RESOURCES`/`OUT_DIR` passed to patch subprocesses (so `providers-registry.json`
  is staged before packaging).
- Payload includes the full `app/` (webview + `.vite` + node_modules) so the
  main-process patch + packager work; only the downloadable Node runtime is excluded.
- `patch-wl-bundle.cjs` normalizes absolute stub requires to relative.

### Known notes
- The base app's proprietary `forge.config.cjs` (defines electron-forge makers,
  e.g. MSIX) is not part of this repo; the release currently ships a portable
  **zip** of each build. To emit an MSIX installer, supply `forge-project/forge.config.cjs`.
- `forge-project` uses pnpm workspaces; `node:sqlite` needs Node >= 22 (CI uses
  Node 20; the step is best-effort and non-blocking).
