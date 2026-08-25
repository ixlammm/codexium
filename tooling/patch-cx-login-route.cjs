const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const f = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");

const c = fs.readFileSync(f, "utf8");

// The app gates the `/login` onboarding route behind a setup/auth guard
// (`JQc` -> `YQc`), so with a model configured the sign-in lands on the empty
// root `/`. Duplicate the login content onto an unconditional top-level route
// `/cx-login` (placed OUTSIDE the guarded group so it always matches), and point
// the profile menu's "Sign in with ChatGPT" at it.
const edits = [
  {
    // 1) Add /cx-login as a top-level route (sibling of /avatar-overlay, before
    //    the guarded JQc group) so it is always reachable.
    anchor: "children:[null,(0,v7.jsx)(FC,{path:`/avatar-overlay`",
    replacement:
      "children:[null,(0,v7.jsx)(FC,{path:`/cx-login`,element:(0,v7.jsx)(b1c,{})}),(0,v7.jsx)(FC,{path:`/avatar-overlay`",
    label: "add /cx-login route",
  },
  {
    // 2) Point the profile "Sign in with ChatGPT" menu item at the new route.
    anchor: "onClick:()=>{o(!1),s(`/login`)}",
    replacement: "onClick:()=>{o(!1),s(`/cx-login`)}",
    label: "redirect sign-in to /cx-login",
  },
];

let patched = c;
for (const { anchor, replacement, label } of edits) {
  if (!patched.includes(anchor)) throw new Error(label + ": anchor not found");
  patched = patched.split(anchor).join(replacement);
}

fs.writeFileSync(f + ".cxlogin", c);
fs.writeFileSync(f, patched);
console.log("renderer cx-login route: OK");
console.log("new length", patched.length, "was", c.length);
