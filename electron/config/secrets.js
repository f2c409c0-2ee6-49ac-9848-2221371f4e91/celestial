import { app } from "electron";
import _0x3fd74a from "fs";
import _0x36f17c from "path";
export const SECRETS = {
  ENCRYPTION_KEY: "",
};
export async function loadEncryptionKey() {
  try {
    const _0x2dc125 = _0x36f17c.join(app.getPath("userData"), ".keys");
    if (_0x3fd74a.existsSync(_0x2dc125)) {
      SECRETS.ENCRYPTION_KEY = _0x3fd74a.readFileSync(_0x2dc125, "utf8");
    }
  } catch (_0x5580e0) {
    console.error("Error loading encryption key:", _0x5580e0);
  }
}
export function getSecret(_0x2867de) {
  return SECRETS[_0x2867de];
}
