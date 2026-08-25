const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// The app uses react-router v7 with DECLARATIVE routing (no global DataRouter),
// so navigation is only reachable via the `useNavigate` hook (`han`). Stash the
// navigate function it returns on `window.__cxNav` so the codexium sign-in can
// route to the `/login` onboarding page.
const anchor = "man(()=>{o.current=!0}),LC.useCallback((r,s={})=>{";
const replacement = "man(()=>{o.current=!0}),window.__cxNav=LC.useCallback((r,s={})=>{";
if (!c.includes(anchor)) throw new Error("useNavigate (han) anchor not found");
const patched = c.split(anchor).join(replacement);

fs.writeFileSync(f + ".navcap", c);
fs.writeFileSync(f, patched);
console.log("renderer navigate capture (window.__cxNav): OK");
console.log("new length", patched.length, "was", c.length);
