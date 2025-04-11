import _0x443eb7 from "javascript-obfuscator";
import { promises as _0x11d06d } from "fs";
import _0x29b41b from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = _0x29b41b.dirname(__filename);
const obfuscatorConfig = {
  compact: true,
  controlFlowFlattening: false,
  controlFlowFlatteningThreshold: 0.3,
  deadCodeInjection: false,
  debugProtection: false,
  debugProtectionInterval: 0x7d0,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal",
  numbersToExpressions: true,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.3,
  transformObjectKeys: false,
};
async function obfuscateFile(_0x4b8c32, _0x2ecd07) {
  const _0xe7fd7 = await _0x11d06d.readFile(_0x4b8c32, "utf8");
  const _0x301f2c = _0x443eb7.obfuscate(_0xe7fd7, obfuscatorConfig);
  await _0x11d06d.writeFile(_0x2ecd07, _0x301f2c.getObfuscatedCode());
}
async function obfuscateDirectory(_0x197370) {
  const _0x1f7b89 = await _0x11d06d.readdir(_0x197370);
  for (const _0x1fd94 of _0x1f7b89) {
    if (_0x1fd94 === "preload.cjs") {
      continue;
    }
    const _0x5edb5d = _0x29b41b.join(_0x197370, _0x1fd94);
    const _0x2ee595 = await _0x11d06d.stat(_0x5edb5d);
    if (_0x2ee595.isDirectory()) {
      if (_0x1fd94 === "config") {
        const _0x6fe7ea = await _0x11d06d.readdir(_0x5edb5d);
        for (const _0x5e5070 of _0x6fe7ea) {
          if (_0x5e5070.endsWith(".js")) {
            const _0x51084e = _0x29b41b.join(_0x5edb5d, _0x5e5070);
            await obfuscateFile(_0x51084e, _0x51084e);
            console.log("Obfuscated config: " + _0x51084e);
          }
        }
      } else {
        await obfuscateDirectory(_0x5edb5d);
      }
    } else if (_0x1fd94.endsWith(".js")) {
      await obfuscateFile(_0x5edb5d, _0x5edb5d);
      console.log("Obfuscated: " + _0x5edb5d);
    }
  }
}
const electronDistPath = _0x29b41b.resolve(__dirname, "../../dist-electron");
await obfuscateDirectory(electronDistPath);
