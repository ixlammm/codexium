const path = require('node:path');

const ROOT = 'C:/Users/Islam/Documents/projects/codex';
const ICON = path.join(ROOT, 'resources/icon-chatgpt.ico').replace(/\\/g, '/');

module.exports = {
  packagerConfig: {
    name: 'Codex',
    executableName: 'Codex',
    asar: true,
    prune: false,
    rebuild: false,
    icon: ICON,
    win32metadata: {
      CompanyName: 'OpenAI',
      ProductName: 'Codex',
      FileDescription: 'Codex',
      OriginalFilename: 'Codex.exe',
    },
    extraResource: [
      path.join(ROOT, 'resources/codex').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/codex.exe').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/codex-code-mode-host').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/codex-code-mode-host.exe').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/codex-command-runner.exe').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/codex-windows-sandbox-setup.exe').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/cua_node').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/native').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/plugins').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/skills').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/rg').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/rg.exe').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/chatgpt-tray-dark.ico').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/chatgpt-tray-light.ico').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/icon-chatgpt.ico').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/codex-notification.wav').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/THIRD_PARTY_NOTICES.txt').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/owl-app.ini').replace(/\\/g, '/'),
      path.join(ROOT, 'resources/owl-electron-app.json').replace(/\\/g, '/'),
    ],
  },
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'Codex',
        setupIcon: ICON,
      },
    },
  ],
};