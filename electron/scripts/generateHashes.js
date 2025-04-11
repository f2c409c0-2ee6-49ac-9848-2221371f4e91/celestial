import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
async function generateHashes() {
  const _0x51c71b = path.join(process.cwd(), "resources", "bin", "cslol-tools");
  const _0x509e75 = [
    "cslol-diag.exe",
    "cslol-dll.dll",
    "mod-tools.exe",
    "wad-extract.exe",
    "wad-made.exe",
  ];
  const _0xdf033f = {};
  for (const _0x3fc9f9 of _0x509e75) {
    const _0x22b936 = path.join(_0x51c71b, _0x3fc9f9);
    const _0x20ae00 = await fs.readFile(_0x22b936);
    const _0x2ecc21 = crypto
      .createHash("sha256")
      .update(_0x20ae00)
      .digest("hex");
    _0xdf033f[_0x3fc9f9] = _0x2ecc21;
  }
  console.log("File hashes:");
  console.log(JSON.stringify(_0xdf033f, null, 2));
}
generateHashes()["catch"](console.error);
