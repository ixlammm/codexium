const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const js = path.join(ROOT, "webview", "assets", "app-initial-CUcIZsiK.js");
const html = path.join(ROOT, "webview", "index.html");

const c = fs.readFileSync(js, "utf8");

const repl = [
  [
    'className:"px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-token-text-secondary",children:k1})',
    '"data-model-group-header":"",className:"pb-0 pt-0.5 text-[9px] font-semibold uppercase tracking-wide text-token-text-secondary",children:k1})',
  ],
  [
    'className:"px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-token-text-secondary",children:k1},k1)',
    '"data-model-group-header":"",className:"pb-0 pt-0.5 text-[9px] font-semibold uppercase tracking-wide text-token-text-secondary",children:k1},k1)',
  ],
  [
    "label:(0,V2.jsx)(u0,{model:e.model,displayName:e.displayName,stripGptPrefix:!0})",
    'label:(0,V2.jsx)("span",{"data-model-group-member":"",children:(0,V2.jsx)(u0,{model:e.model,displayName:e.displayName,stripGptPrefix:!0})})',
  ],
  [
    '{"data-model-selected":m,RightIcon:h,onSelect:g,children:v}',
    '{"data-model-selected":m,"data-model-group-member":"",RightIcon:h,onSelect:g,children:v}',
  ],
];

let patched = c;
for (const [oldS, newS] of repl) {
  const n = patched.split(oldS).length - 1;
  if (n !== 1) throw new Error("expected 1 occurrence, found " + n + " for:\n" + oldS.slice(0, 80));
  patched = patched.split(oldS).join(newS);
}

fs.writeFileSync(js + ".gsty", c);
fs.writeFileSync(js, patched);
console.log("renderer group styling marks: OK");

const h = fs.readFileSync(html, "utf8");
const css = [
  "[data-model-group-header]{font-size:9px!important}",
  "[role=menuitem]:has([data-model-group-header]){padding:2px 5px 4px 8px !important;cursor:default!important}",
  "[role=menuitem]:has([data-model-group-header]):hover,[role=menuitem]:has([data-model-group-header]):focus,[role=menuitem]:has([data-model-group-header])[data-highlighted]{background-color:transparent!important}",
].join("\r\n      ");
const style =
  "\r\n\r\n\r\n    <style id=\"opencode-model-group-styling\">\r\n      " +
  css +
  "\r\n    </style>\r\n";
if (h.includes('id="opencode-model-group-styling"')) throw new Error("style already injected");
const headIdx = h.lastIndexOf("</head>");
if (headIdx < 0) throw new Error("</head> not found");
const normalized = h.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "\r\n");
const normHead = normalized.lastIndexOf("</head>");
const patchedHtml = normalized.slice(0, normHead) + style + normalized.slice(normHead);
fs.writeFileSync(html, patchedHtml);
console.log("index.html styling: OK");
console.log("js length", patched.length, "was", c.length);