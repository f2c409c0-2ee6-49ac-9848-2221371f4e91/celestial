import _0x5d7f52 from "path";
import _0x4e614d from "fs/promises";
import _0x5acdaa from "crypto";
import { app } from "electron";
import _0x1e4584 from "fs";
export class ResourceManager {
  constructor() {
    this.REQUIRED_FILES = [
      "cslol-diag.exe",
      "cslol-dll.dll",
      "mod-tools.exe",
      "wad-extract.exe",
      "wad-make.exe",
    ];
    this.FILE_HASHES = {
      "cslol-diag.exe":
        "feb3f1bb38fb28fb859e27f15f8ba152cfcaeb8dbece5d1f8973e055a741a882",
      "cslol-dll.dll":
        "0fd833c3afd22b405f513cd870358841b18913ef8adda5b1df42b069fef385f7",
      "mod-tools.exe":
        "f9691796010467356ebdeb1b50d855007857f785046f385f71d751712d82814a",
      "wad-extract.exe":
        "270a5958820b9e71c71494d748c29896265c1f2b52046565062d755cb1220dd7",
      "wad-make.exe":
        "e73e8160f52609629695f0455038dfaf8684a946e538b6693f648f6e3c7cbd55",
    };
    this.initialized = false;
    const _0x34803a = process.env.NODE_ENV === "development";
    if (_0x34803a) {
      this.resourcesPath = _0x5d7f52.join(process.cwd(), "resources");
    } else {
      const _0x41a4f7 = app.getPath("exe");
      const _0x37ba30 = _0x5d7f52.dirname(_0x41a4f7);
      this.resourcesPath = _0x5d7f52.join(_0x37ba30, "resources");
    }
    this.toolsPath = _0x5d7f52.join(this.resourcesPath, "bin", "cslol-tools");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Resources Path:", this.resourcesPath);
    console.log("Tools Path:", this.toolsPath);
    if (!_0x1e4584.existsSync(this.resourcesPath)) {
      throw new Error("Resources path not found: " + this.resourcesPath);
    }
    if (!_0x1e4584.existsSync(this.toolsPath)) {
      throw new Error("Tools path not found: " + this.toolsPath);
    }
  }
  async ["initialize"]() {
    if (this.initialized) {
      return;
    }
    try {
      await _0x4e614d.mkdir(this.toolsPath, {
        recursive: true,
      });
      await this.verifyTools();
      await this.setToolPermissions();
      this.initialized = true;
      console.log("Resource Manager initialized successfully");
    } catch (_0x5a6e05) {
      console.error("Failed to initialize ResourceManager:", _0x5a6e05);
      throw new Error(
        "Resource initialization failed: " +
          (_0x5a6e05 instanceof Error ? _0x5a6e05.message : "Unknown error")
      );
    }
  }
  async ["verifyTools"]() {
    const _0xf651d3 = [];
    const _0x428769 = [];
    for (const _0x469b6e of this.REQUIRED_FILES) {
      const _0x1219a2 = _0x5d7f52.join(this.toolsPath, _0x469b6e);
      try {
        const _0x53fff5 = await _0x4e614d
          .access(_0x1219a2)
          .then(() => true)
          ["catch"](() => false);
        if (!_0x53fff5) {
          _0xf651d3.push(_0x469b6e);
          continue;
        }
        if (!(await this.verifyFileIntegrity(_0x1219a2, _0x469b6e))) {
          _0x428769.push(_0x469b6e);
        }
      } catch (_0x51027f) {
        console.error("Error verifying " + _0x469b6e + ":", _0x51027f);
        throw _0x51027f;
      }
    }
    if (_0xf651d3.length > 0 || _0x428769.length > 0) {
      throw new Error(
        "Resource verification failed:\n" +
          ("Missing files: " + _0xf651d3.join(", ") + "\n") +
          ("Invalid files: " + _0x428769.join(", "))
      );
    }
  }
  async ["setToolPermissions"]() {
    for (const _0x39c632 of this.REQUIRED_FILES) {
      const _0x34310d = _0x5d7f52.join(this.toolsPath, _0x39c632);
      await _0x4e614d.chmod(_0x34310d, 448);
    }
  }
  async ["verifyFileIntegrity"](_0x2c8bad, _0x4e7db4) {
    const _0x364547 = await _0x4e614d.readFile(_0x2c8bad);
    const _0xbb0224 = _0x5acdaa
      .createHash("sha256")
      .update(_0x364547)
      .digest("hex");
    return _0xbb0224 === this.FILE_HASHES[_0x4e7db4];
  }
  ["getToolPath"](_0x49d744) {
    if (!this.REQUIRED_FILES.includes(_0x49d744)) {
      throw new Error("Invalid tool requested: " + _0x49d744);
    }
    const _0x167664 = _0x5d7f52.join(this.toolsPath, _0x49d744);
    if (!_0x1e4584.existsSync(_0x167664)) {
      throw new Error("Tool not found: " + _0x167664);
    }
    return _0x167664;
  }
}
export const resourceManager = new ResourceManager();
