const fs = require("fs");
const path = require("path");

const ROOT = process.env.FORGE_ROOT || path.join(__dirname, "..", "forge-project");
const ASSETS = path.join(ROOT, "webview", "assets");
const initial = path.join(ASSETS, "app-initial-CUcIZsiK.js");

// Prepend a telemetry blocker to the renderer bundle. This is the most reliable
// injection point: app-initial-CUcIZsiK.js definitely loads & executes, and a
// plain statement at the top of an ES module is valid (no CSP / script-loading
// issues, unlike a separate <script src>).
const BLOCKER = `/* codex: neuter telemetry */ (function () {
  "use strict";
  var RE = /wham\\/analytics-events|\\/log_event|\\/sdk_exception|sentry\\.io|ingest\\.sentry/i;
  function isTelemetry(u){ try { return RE.test(String(u)); } catch (e) { return false; } }
  function blankResp(){ try { return new Response("", { status: 200, headers: { "Content-Type": "text/plain" } }); } catch (e) { return null; } }
  var of = window.fetch;
  if (typeof of === "function") {
    window.fetch = function (input, init) {
      var url = (typeof input === "string") ? input : (input && input.url) || "";
      if (isTelemetry(url)) { return Promise.resolve(blankResp()); }
      return of.apply(this, arguments);
    };
  }
  var oo = XMLHttpRequest.prototype.open;
  var os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__cxTelemetry = isTelemetry(u); return oo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () { if (this.__cxTelemetry) return undefined; return os.apply(this, arguments); };
  var ob = navigator.sendBeacon;
  if (typeof ob === "function") {
    navigator.sendBeacon = function (u, d) { if (isTelemetry(u)) return true; return ob.call(this, u, d); };
  }
})();
`;

const c = fs.readFileSync(initial, "utf8");
if (c.includes("codex: neuter telemetry")) throw new Error("telemetry blocker already applied");
fs.writeFileSync(initial + ".notelemetry", c);
fs.writeFileSync(initial, BLOCKER + "\n" + c);
console.log("renderer telemetry blocker prepended to app-initial: OK");
