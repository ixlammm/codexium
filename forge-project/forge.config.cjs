module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Codex',
    executableName: 'Codex',
  },
  rebuildConfig: {},
  makers: [
    // Windows installer (Squirrel Setup.exe — no signing cert needed) +
    // best-effort MSIX + a portable zip.
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: { name: 'Codex', setupExe: 'CodexSetup-x64.exe' },
    },
    {
      name: '@electron-forge/maker-msix',
      platforms: ['win32'],
      config: {
        appId: 'com.openai.codex',
        displayName: 'Codex',
        appIdentity: 'OpenAI.Codex',
      },
    },
    { name: '@electron-forge/maker-zip', platforms: ['win32'] },
  ],
};
