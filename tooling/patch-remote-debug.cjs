const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const buildDir = path.join(ROOT, ".vite", "build");
const mainFile = (() => {
  for (const n of fs.readdirSync(buildDir)) {
    if (n.startsWith("main-") && n.endsWith(".js")) return path.join(buildDir, n);
  }
  throw new Error("main-*.js not found");
})();

let c = fs.readFileSync(mainFile, "utf8");
const before = c;

// Enable CDP remote debugging so opencode's chrome-devtools MCP can attach to
// the Codex renderer. Set it right before the app becomes ready. Allowed as an
// env override (CODEX_DEVTOOLS_PORT), default 9222.
const injection = "l.app.commandLine.appendSwitch(`remote-debugging-port`,process.env.CODEX_DEVTOOLS_PORT||`9222`);";
if (c.includes("remote-debugging-port")) {
  throw new Error("remote-debugging-port already present; skipping to avoid duplicate");
}
const anchor = ";await l.app.whenReady()";
if (!c.includes(anchor)) throw new Error("app.whenReady anchor not found");
c = c.replace(anchor, ";" + injection + anchor);

fs.writeFileSync(mainFile + ".rdbg", before);
fs.writeFileSync(mainFile, c);
console.log("remote-debugging-port enabled: OK");
console.log("new length", c.length, "was", before.length);
