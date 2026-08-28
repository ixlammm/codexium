module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Codex',
    executableName: 'Codex',
  },
  rebuildConfig: {},
  makers: [
    // Windows installer (MSIX, best-effort sideload) + a portable zip.
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
