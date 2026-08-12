const packager = require('@electron/packager');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.on('unhandledRejection', (r) => {
  fs.writeFileSync(path.join(os.tmpdir(), 'pkg-err.txt'), (r && r.stack) || String(r));
  console.error('UNHANDLED');
  process.exit(1);
});

const REPO = path.join(__dirname, '..');
const STAGED_RES = path.join(REPO, 'build', 'resources');
const ROOT = STAGED_RES;
const APP_DIR = process.env.FORGE_ROOT || path.join(REPO, 'forge-project');
const NATIVE_RES = process.env.NATIVE_RESOURCES || ROOT;
const OUT_DIR = process.env.OUT_DIR || path.join(REPO, 'forge-project', 'out');
const extraResource = [
  'codex',
  'codex.exe',
  'codex-code-mode-host',
  'codex-code-mode-host.exe',
  'codex-command-runner.exe',
  'codex-windows-sandbox-setup.exe',
  'cua_node',
  'native',
  'plugins',
  'skills',
  'rg',
  'rg.exe',
  'chatgpt-tray-dark.ico',
  'chatgpt-tray-light.ico',
  'icon-chatgpt.ico',
  'codex-notification.wav',
  'THIRD_PARTY_NOTICES.txt',
  'owl-app.ini',
  'owl-electron-app.json',
].map((f) => path.join(NATIVE_RES, f).replace(/\\/g, '/'));

packager({
  dir: APP_DIR,
  name: 'Codex',
  executableName: 'Codex',
  platform: 'win32',
  arch: 'x64',
  asar: true,
  overwrite: true,
  prune: false,
  rebuild: false,
  out: OUT_DIR,
  electronVersion: '42.3.0',
  icon: path.join(NATIVE_RES, 'icon-chatgpt.ico').replace(/\\/g, '/'),
  win32metadata: {
    CompanyName: 'OpenAI',
    ProductName: 'Codex',
    FileDescription: 'Codex',
    OriginalFilename: 'Codex.exe',
  },
  extraResource,
  quiet: false,
})
  .then((paths) => {
    fs.writeFileSync(path.join(os.tmpdir(), 'pkg-out.txt'), JSON.stringify(paths));
    console.log('DONE');
  })
  .catch((err) => {
    fs.writeFileSync(path.join(os.tmpdir(), 'pkg-err.txt'), (err && err.stack) || String(err));
    console.error('ERR');
  });