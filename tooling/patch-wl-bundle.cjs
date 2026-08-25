const fs = require('fs');
const path = require('path');
const ROOT = process.env.FORGE_ROOT || 'C:/Users/Islam/AppData/Local/Temp/opencode/codex-rebuild/forge-project';
const f = path.join(ROOT, 'node_modules/@worklouder/device-kit-oai/node_modules/@worklouder/wl-device-kit/dist/index.js');
const stubPath = path.join(ROOT, 'node_modules/@worklouder/device-kit-oai/node_modules/node-hid/stub-index.js');

// Relative requires so the bundle is location-independent (works wherever the
// repo is checked out, and is byte-identical across build directories).
const distDir = path.dirname(f);
const relHid = path.relative(distDir, stubPath).replace(/\\/g, '/');
const relSerial = relHid + '.serialport';

let c = fs.readFileSync(f, 'utf8');
let changes = 0;

const absRe = /require\("(?:C:|[A-Za-z]:)[^"]*(?:codex-rebuild|codex-rebuild-work|forge-project)[^"]*\/stub-index\.js(?:\.serialport)?"\)/g;

// Normalize any prior absolute-path stub requires to the relative form.
c = c.replace(absRe, (m) => {
  changes++;
  const isSerial = /serialport/.test(m);
  return `require("${isSerial ? relSerial : relHid}")`;
});

// Replace pristine node-hid requires with the stub
const hidRe = /require\("node-hid"\)/g;
c = c.replace(hidRe, (m) => {
  changes++;
  return `require("${relHid}")`;
});

// Replace pristine serialport requires with the serialport stub
const serialRe = /require\("serialport"\)/g;
c = c.replace(serialRe, (m) => {
  changes++;
  return `require("${relSerial}")`;
});

fs.writeFileSync(f, c);
console.log('patched requires (relative), changes:', changes);

// write a serialport stub that exports the SerialPort class (throwing) so imports resolve
const spStub = `
'use strict';
class SerialPort {
  constructor() { throw new Error('serialport is unavailable in this build (native ABI mismatch). Codex Micro hardware support is disabled.'); }
  static list() { return Promise.resolve([]); }
  static detect() { return Promise.resolve([]); }
}
module.exports = SerialPort;
module.exports.SerialPort = SerialPort;
module.exports.default = SerialPort;
`;
fs.writeFileSync(stubPath + '.serialport', spStub);
console.log('wrote serialport stub');

// write a node-hid stub that re-exports the serialport stub, so the wl-device-kit
// require("node-hid") resolves without a native ABI match.
const hidStub = `
'use strict';
const SerialPort = require('./stub-index.js.serialport');
class HID {
  constructor() { throw new Error('node-hid is unavailable in this build (native ABI mismatch). Hardware HID support is disabled.'); }
  static devices() { return Promise.resolve([]); }
  static async() { return Promise.resolve([]); }
}
module.exports = HID;
module.exports.HID = HID;
module.exports.SerialPort = SerialPort;
module.exports.default = HID;
`;
fs.writeFileSync(stubPath, hidStub);
console.log('wrote node-hid stub');