const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// react-router v7 exposes two `useNavigate` implementations: the declarative
// `han` (Router context) and the data-router `Pan` (router.navigate). Stash
// both on `window` so the codexium Providers page can route to the ChatGPT
// sign-in ("Sign in with ChatGPT") and back — matching the profile menu's own
// `navigate('/login')`.
const anchors = [
  {
    anchor: "man(()=>{o.current=!0}),LC.useCallback((r,s={})=>{",
    replacement: "man(()=>{o.current=!0}),window.__cxNav=LC.useCallback((r,s={})=>{",
    label: "han (declarative useNavigate)",
  },
  {
    anchor: "LC.useCallback(async(r,i={})=>{wC(n.current,isn)",
    replacement: "window.__cxNavRS=LC.useCallback(async(r,i={})=>{wC(n.current,isn)",
    label: "Pan (data-router useNavigate)",
  },
];

let patched = c;
for (const { anchor, replacement, label } of anchors) {
  if (!patched.includes(anchor)) throw new Error(label + " anchor not found");
  patched = patched.split(anchor).join(replacement);
}

fs.writeFileSync(f + ".openaisignin", c);
fs.writeFileSync(f, patched);
console.log("renderer OpenAI sign-in navigate capture: OK");
console.log("new length", patched.length, "was", c.length);
