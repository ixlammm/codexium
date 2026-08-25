const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// Two edits so custom-provider users are never locked out of the app and can
// always re-log-in to OpenAI when they want:
//
// 1) `requiresAuth` was forced to `true` (`e.requiresOpenaiAuth ?? true`), which
//    gates the whole app behind OpenAI sign-in even when the user is on a custom
//    API-key provider (e.g. `model = deepseek.deepseek-v4-flash-vision-exp`).
//    Only require OpenAI auth when the active auth actually needs it (chatgpt /
//    copilot); API-key + personal-access-token modes must not force login.
// 2) The profile menu only offered "Sign in with ChatGPT" when the user was NOT
//    in any auth mode (`!O`), so an API-key user who logged out of OpenAI never
//    saw a way back. Show the sign-in entry whenever there is no OpenAI account.
const edits = [
  {
    anchor: "requiresAuth:r===`copilot`||(e.requiresOpenaiAuth??!0)",
    replacement: "requiresAuth:r===`copilot`||(r!==`apikey`&&r!==`personalAccessToken`&&(e.requiresOpenaiAuth??!0))",
    label: "requiresAuth: don't force OpenAI login for custom auth methods",
  },
  {
    anchor: "I=!O&&g==null&&m",
    replacement: "I=g!==`chatgpt`&&g!==`copilot`",
    label: "profile menu: show Sign in whenever not in a ChatGPT/Copilot account",
  },
];

let patched = c;
for (const { anchor, replacement, label } of edits) {
  if (!patched.includes(anchor)) throw new Error(label + ": anchor not found");
  patched = patched.split(anchor).join(replacement);
}

fs.writeFileSync(f + ".authaccess", c);
fs.writeFileSync(f, patched);
console.log("renderer auth-access (no forced OpenAI login): OK");
console.log("new length", patched.length, "was", c.length);
