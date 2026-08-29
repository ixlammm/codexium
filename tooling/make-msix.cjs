"use strict";
// Build an unsigned (sideload) MSIX installer directly from the packaged Codex
// app using electron-windows-msix. This bypasses electron-forge (whose `pnpm
// install` fails because forge-project depends on a private monorepo's
// `workspace:*` packages) while still producing a real installable .msix.
//
//   node tooling/make-msix.cjs
// Env: MSIX_APP_DIR (default forge-project/out/Codex-win32-x64)
//      MSIX_OUT_DIR (default forge-project/out/installer)
//      APP_VERSION  (default from forge-project/package.json)

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const APP = process.env.MSIX_APP_DIR || path.join(REPO, "forge-project", "out", "Codex-win32-x64");
const OUT = process.env.MSIX_OUT_DIR || path.join(REPO, "forge-project", "out", "installer");
const VER = process.env.APP_VERSION || require(path.join(REPO, "forge-project", "package.json")).version;
const CERT_PASSWORD = "CodexiumDev2026!";

if (!fs.existsSync(path.join(APP, "Codex.exe"))) {
  console.error("[make-msix] packaged app not found at", APP, "— try the build step first");
  process.exit(1);
}

// Locate makeappx.exe + signtool.exe from the Windows 10 SDK.
// Prefer an explicit WINDOWS_KIT_PATH; otherwise pick the newest x64 kit dir.
function findWindowsKit() {
  if (process.env.WINDOWS_KIT_PATH && fs.existsSync(process.env.WINDOWS_KIT_PATH)) return process.env.WINDOWS_KIT_PATH;
  const base = "C:\\Program Files (x86)\\Windows Kits\\10\\bin";
  if (!fs.existsSync(base)) return undefined;
  const dirs = [];
  for (const v of fs.readdirSync(base)) {
    const x64 = path.join(base, v, "x64");
    if (fs.existsSync(path.join(x64, "makeappx.exe"))) dirs.push(x64);
  }
  dirs.sort();
  return dirs[dirs.length - 1];
}
const windowsKitPath = findWindowsKit();
const signtool = windowsKitPath ? path.join(windowsKitPath, "signtool.exe") : undefined;
if (!windowsKitPath) console.warn("[make-msix] WARNING: no Windows SDK makeappx/signtool found — MSIX may fail");

const { packageMSIX } = require("electron-windows-msix");

function run(exe, args, opts) {
  const r = spawnSync(exe, args, { encoding: "utf8", ...opts });
  if (r.error) throw new Error(`failed to run ${exe}: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${path.basename(exe)} exited ${r.status}\n${(r.stderr || r.stdout || "").slice(-1500)}`);
  return r.stdout || "";
}

// Create a self-signed CodeSigning dev cert + export .cer/.pfx (matches the
// subject the manifest uses, CN=OpenAI). The user trusts the .cer to install.
function createDevCert() {
  const subject = "CN=OpenAI";
  const pfx = path.join(OUT, "dev_cert.pfx");
  const cer = path.join(OUT, "dev_cert.cer");
  const script = `
$pwd = ConvertTo-SecureString -String '${CERT_PASSWORD}' -Force -AsPlainText
$cert = New-SelfSignedCertificate -DnsName 'electron.windows.msix.dev' -Subject '${subject}' -KeyExportPolicy Exportable -KeyLength 2048 -KeyUsage DigitalSignature -Type CodeSigning -KeySpec Signature -NotAfter (Get-Date).AddYears(99) -CertStoreLocation 'cert:\\CurrentUser\\My'
Export-Certificate -Cert $cert -FilePath '${cer}' | Out-Null
Export-PfxCertificate -Cert $cert -FilePath '${pfx}' -Password $pwd | Out-Null
`;
  const ps1 = path.join(os.tmpdir(), "codexium-dev-cert.ps1");
  fs.writeFileSync(ps1, script);
  run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `& '${ps1}'`]);
  fs.unlinkSync(ps1);
  return { pfx, cer };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  console.log("[make-msix] packaging", APP, "-> MSIX (windowsKit:", windowsKitPath || "auto", ")");
  await packageMSIX({
    appDir: APP,
    outputDir: OUT,
    packageName: "Codex",
    sign: false, // pack first; we sign offline below with the Kit signtool (no timestamp server)
    logLevel: "warn",
    createPri: false, // makepri chokes on the vendored cua_node payload; skip resource indexing
    windowsKitPath,
    manifestVariables: {
      packageIdentity: "OpenAI.Codex",
      publisher: "CN=OpenAI",
      publisherDisplayName: "OpenAI",
      packageVersion: `${VER}.0`,
      packageDisplayName: "Codex",
      packageDescription: "Codex",
      appExecutable: "Codex.exe",
      appDisplayName: "Codex",
      targetArch: "x64",
      packageMinOSVersion: "10.0.17763.0",
      packageMaxOSVersionTested: "10.0.22621.0",
    },
  });
  const msix = path.join(OUT, fs.readdirSync(OUT).find((f) => /\.msix$/i.test(f)) || "");
  if (!msix) { console.error("[make-msix] no .msix produced"); process.exit(1); }

  // Self-sign offline with a dev cert; no timestamp server (which is what broke
  // electron-windows-msix's built-in signing). User installs dev_cert.cer then
  // Add-AppxPackage (no -AllowUnsigned) — this avoids the "unsigned namespace" error.
  if (signtool) {
    const { pfx, cer } = createDevCert();
    console.log("[make-msix] signing", msix, "with dev cert...");
    run(signtool, ["sign", "/f", pfx, "/p", CERT_PASSWORD, "/fd", "sha256", "/d", "Codex", msix]);
    console.log("[make-msix] signed. Cert to trust:", cer);
  } else {
    console.warn("[make-msix] signtool missing — leaving package UNSIGNED (installer will need -AllowUnsigned + Developer Mode)");
  }

  const files = fs.readdirSync(OUT).filter((f) => /\.(msix|cer)$/i.test(f));
  console.log("[make-msix] created:", files.join(", "), "in", OUT);
})().catch((e) => {
  console.error("[make-msix] ERROR:", (e && e.stack) || e);
  process.exit(1);
});
