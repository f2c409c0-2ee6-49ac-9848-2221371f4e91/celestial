import { app } from "electron";
import _0x4aeacc from "path";
import _0x384f2e from "fs/promises";
import { store } from "../store.js";
import { spawn } from "child_process";
import _0x1831ec from "fs";
import _0x1f5434 from "crypto";
import _0x2c8711 from "dotenv";
import { resourceManager } from "./resourceManager.js";
import { SECRETS } from "../config/secrets.js";
import { skinService } from "./skinService.js";
import { skinHelpers } from "../store.js";
_0x2c8711.config();
class InstallLock {
  constructor() {
    this.resolver = null;
    this.promise = Promise.resolve();
  }
  async ["acquire"]() {
    await this.promise;
    this.promise = new Promise((_0x1b3e92) => {
      this.resolver = _0x1b3e92;
    });
  }
  ["release"]() {
    if (this.resolver) {
      this.resolver();
      this.resolver = null;
    }
  }
}
export class CslolService {
  constructor() {
    this.patcherProcess = null;
    this.sessionDirectories = new Map();
    this.isInstalling = false;
    this.installLock = new InstallLock();
    this.lastStatusTime = 0;
    this.statusQueue = [];
    this.statusUpdateInterval = null;
    this.STATUS_THROTTLE_MS = 1000;
    this.initializeService()["catch"]((_0x45b77e) => {
      console.error("Failed to initialize CslolService:", _0x45b77e);
      throw _0x45b77e;
    });
  }
  async ["initializeService"]() {
    try {
      await resourceManager.initialize();
      this.toolsPath = _0x4aeacc.dirname(
        resourceManager.getToolPath("mod-tools.exe")
      );
      this.initializePaths();
      await this.ensureDirectoryStructure();
    } catch (_0x5dbc55) {
      console.error("CslolService initialization failed:", _0x5dbc55);
      throw _0x5dbc55;
    }
  }
  ["generateRandomPath"](_0x5461ee) {
    const _0x5c9966 = _0x1f5434.randomBytes(16).toString("hex");
    const _0x306397 = _0x1f5434.randomBytes(16).toString("hex");
    const _0x47fa9d = _0x4aeacc.join(
      app.getPath("appData"),
      _0x5c9966,
      _0x306397
    );
    this.sessionDirectories.set(_0x47fa9d, _0x5461ee);
    return _0x47fa9d;
  }
  ["initializePaths"]() {
    const _0x3788e5 = store.get("paths.cache");
    if (!_0x3788e5) {
      const _0x5dbbae = _0x1f5434.randomBytes(32).toString("hex");
      this.cachePath = _0x4aeacc.join(app.getPath("appData"), _0x5dbbae);
      store.set("paths.cache", this.cachePath);
    } else {
      this.cachePath = _0x3788e5;
    }
    _0x1831ec.mkdirSync(this.cachePath, {
      recursive: true,
      mode: 0x1c0,
    });
    this.sessionDirectories.set(this.cachePath, "cache");
    const _0x2b64d8 = _0x1f5434.randomBytes(16).toString("hex");
    const _0x28127c = _0x4aeacc.join(
      app.getPath("temp"),
      "celestial-launcher",
      _0x2b64d8
    );
    this.tempPath = _0x4aeacc.join(_0x28127c, "temp");
    this.installedPath = _0x4aeacc.join(_0x28127c, "installed");
    this.profilesPath = _0x4aeacc.join(_0x28127c, "profiles");
    this.sessionDirectories.set(this.tempPath, "temp");
    this.sessionDirectories.set(this.installedPath, "installed");
    this.sessionDirectories.set(this.profilesPath, "profiles");
  }
  async ["ensureDirectoryStructure"]() {
    const _0x2ee06a = [
      this.toolsPath,
      this.tempPath,
      this.installedPath,
      this.profilesPath,
      this.cachePath,
    ];
    for (const _0x236f85 of _0x2ee06a) {
      try {
        await _0x384f2e.mkdir(_0x236f85, {
          recursive: true,
          mode: 0x1c0,
        });
      } catch (_0x59ccf6) {
        console.error("Error creating directory " + _0x236f85 + ":", _0x59ccf6);
      }
    }
  }
  ["getToolsPath"]() {
    return this.toolsPath;
  }
  ["getLeaguePath"]() {
    const _0x30a1cc = store.get("settings.leaguePath");
    if (!_0x30a1cc) {
      throw new Error("League path not set in settings");
    }
    const _0x54878a = _0x4aeacc.dirname(_0x30a1cc);
    if (!_0x1831ec.existsSync(_0x54878a)) {
      throw new Error("League directory does not exist: " + _0x54878a);
    }
    return _0x54878a;
  }
  async ["runTool"](_0x3bb335) {
    const _0x31beac = resourceManager.getToolPath("mod-tools.exe");
    return new Promise((_0x4753f7, _0x3899a7) => {
      const _0x1606a3 = spawn(_0x31beac, _0x3bb335, {
        cwd: this.toolsPath,
        env: {
          ...globalThis.process.env,
          PATH:
            "" +
            this.toolsPath +
            _0x4aeacc.delimiter +
            globalThis.process.env.PATH,
        },
      });
      let _0x1430c9 = "";
      _0x1606a3.stdout?.["on"]("data", (_0x440bc3) => {
        console.log("Tool stdout: " + _0x440bc3.toString().trim());
      });
      _0x1606a3.stderr?.["on"]("data", (_0x2fd183) => {
        const _0x923bac = _0x2fd183.toString().trim();
        console.error("Tool stderr: " + _0x923bac);
        _0x1430c9 += _0x923bac + "\n";
      });
      _0x1606a3.on("error", (_0x27fa02) => {
        _0x3899a7(_0x27fa02);
      });
      _0x1606a3.on("exit", (_0x43cec0) => {
        if (_0x43cec0 !== 0) {
          let _0x32fba2 = "";
          console.error(
            "Tool exited with code " + _0x43cec0 + ", raw error output:",
            _0x1430c9
          );
          console.error("Failed command:", _0x31beac);
          console.error("Arguments:", _0x3bb335);
          for (const _0x2d31a1 of _0x1430c9.toLowerCase().split("\n")) {
            if (!_0x2d31a1.includes("error: ")) {
              continue;
            }
            if (_0x2d31a1.startsWith("error: file.error ->")) {
              _0x32fba2 +=
                "Something is locking the files, please restart computer. If persists could be anti-virus or something similar.";
            } else {
              if (
                _0x2d31a1.startsWith("error: impl_reserve(endpos) ->") ||
                _0x2d31a1.includes("impl_reserve")
              ) {
                _0x32fba2 += "Not enough disk space.";
              } else {
                if (
                  _0x2d31a1.startsWith("error: failed to find base wad for:")
                ) {
                  _0x32fba2 +=
                    "Couldn't find the following wad(s): " +
                    _0x2d31a1
                      .split("error: failed to find base wad for: ")
                      .join("") +
                    ".";
                } else {
                  if (_0x2d31a1.startsWith("error: not a valid game folder")) {
                    _0x32fba2 +=
                      "Not a valid Game folder, please select again.";
                  } else {
                    if (_0x2d31a1.startsWith("error: not valid mod")) {
                      _0x32fba2 += "Invalid mod.";
                    } else {
                      if (
                        _0x2d31a1.includes("access") ||
                        _0x2d31a1.includes("permission")
                      ) {
                        _0x32fba2 +=
                          "Permission denied. Try running as administrator.";
                      } else if (
                        _0x2d31a1.includes("error: rename:") &&
                        _0x2d31a1.includes("access is denied")
                      ) {
                        _0x32fba2 +=
                          "File access denied during rename operation. This often happens with paths containing spaces.";
                      } else {
                        console.error("Not registered error: " + _0x2d31a1);
                      }
                    }
                  }
                }
              }
            }
          }
          if (_0x32fba2.length === 0) {
            if (
              _0x1430c9.toLowerCase().includes("access") ||
              _0x1430c9.toLowerCase().includes("permission")
            ) {
              _0x32fba2 = "Permission denied. Try running as administrator.";
            } else {
              if (
                _0x1430c9.toLowerCase().includes("space") ||
                _0x1430c9.toLowerCase().includes("disk") ||
                _0x1430c9.toLowerCase().includes("impl_reserve")
              ) {
                _0x32fba2 =
                  "Not enough disk space on C: drive. Please free up some space and try again.";
              } else {
                if (
                  _0x1430c9.toLowerCase().includes("not found") ||
                  _0x1430c9.toLowerCase().includes("missing")
                ) {
                  _0x32fba2 =
                    "Missing file or directory. Try repairing the installation.";
                } else if (
                  _0x1430c9.toLowerCase().includes("rename:") &&
                  (_0x1430c9.toLowerCase().includes("access is denied") ||
                    _0x1430c9.toLowerCase().includes("access denied"))
                ) {
                  _0x32fba2 =
                    "File access denied during operation. This often happens with paths containing spaces.";
                } else {
                  _0x32fba2 =
                    "Couldn't figure out the error, please contact support.";
                }
              }
            }
          }
          _0x32fba2 +=
            " Don't be shy to ask for help if you can't manage to fix it.";
          console.error("Processed error message: " + _0x32fba2);
          _0x3899a7(new Error(_0x32fba2));
          return;
        }
        _0x4753f7();
      });
    });
  }
  async ["getInstalledSkins"]() {
    try {
      const _0x5c0733 = this.cachePath;
      if (!_0x5c0733) {
        return [];
      }
      try {
        await _0x384f2e.access(_0x5c0733);
      } catch {
        return [];
      }
      const _0x47573a = await _0x384f2e.readdir(_0x5c0733);
      const _0x3174af = [];
      for (const _0x2b9e4e of _0x47573a) {
        try {
          const _0x41801d = _0x4aeacc.join(_0x5c0733, _0x2b9e4e);
          const _0xef041a = await _0x384f2e.stat(_0x41801d);
          if (_0xef041a.isDirectory()) {
            const _0x37a1b8 = _0x4aeacc.join(_0x41801d, "data.mov");
            try {
              await _0x384f2e.access(_0x37a1b8);
              const _0x2e771e = parseInt(_0x2b9e4e);
              if (!isNaN(_0x2e771e)) {
                _0x3174af.push(_0x2e771e);
              }
            } catch {
              continue;
            }
          }
        } catch (_0x312fad) {
          continue;
        }
      }
      return _0x3174af;
    } catch (_0x57b35e) {
      return [];
    }
  }
  async ["encryptDirectory"](_0x2a2d49, _0x5732f6) {
    await _0x384f2e.mkdir(_0x5732f6, {
      recursive: true,
    });
    const _0x1df77d = await this.getAllFiles(_0x2a2d49);
    const _0x188ce9 = {
      files: await Promise.all(
        _0x1df77d.map(async (_0x26c004) => {
          const _0x499d6f = _0x4aeacc.relative(_0x2a2d49, _0x26c004);
          const _0x32ee8a = await _0x384f2e.readFile(_0x26c004);
          return {
            path: _0x499d6f,
            content: _0x32ee8a,
          };
        })
      ),
    };
    const _0x333356 = _0x1f5434.randomBytes(16);
    const _0x421c5d = _0x1f5434.createCipheriv(
      "aes-256-cbc",
      Buffer.from(SECRETS.ENCRYPTION_KEY, "hex"),
      _0x333356
    );
    const _0x9728e0 = JSON.stringify(_0x188ce9);
    const _0x3ef92e = Buffer.concat([
      _0x333356,
      _0x421c5d.update(Buffer.from(_0x9728e0)),
      _0x421c5d.final(),
    ]);
    await _0x384f2e.writeFile(_0x4aeacc.join(_0x5732f6, "data.mov"), _0x3ef92e);
  }
  async ["decryptDirectory"](_0x552bdf, _0x5f461d) {
    try {
      await _0x384f2e.mkdir(_0x5f461d, {
        recursive: true,
      });
      const _0x1ec8d6 = await _0x384f2e.readFile(
        _0x4aeacc.join(_0x552bdf, "data.mov")
      );
      const _0x558928 = _0x1ec8d6.subarray(0, 16);
      const _0x3eed83 = _0x1ec8d6.subarray(16);
      const _0x4f40e2 = _0x1f5434.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(SECRETS.ENCRYPTION_KEY, "hex"),
        _0x558928
      );
      const _0x4c4184 = Buffer.concat([
        _0x4f40e2.update(_0x3eed83),
        _0x4f40e2.final(),
      ]);
      const _0x47b8a9 = JSON.parse(_0x4c4184.toString());
      for (const _0x59807f of _0x47b8a9.files) {
        const _0x505eef = _0x4aeacc.join(_0x5f461d, _0x59807f.path);
        await _0x384f2e.mkdir(_0x4aeacc.dirname(_0x505eef), {
          recursive: true,
        });
        await _0x384f2e.writeFile(_0x505eef, Buffer.from(_0x59807f.content));
      }
    } catch (_0x4b84e6) {
      throw _0x4b84e6;
    }
  }
  async ["getAllFiles"](_0xd37d38) {
    const _0x51760b = await _0x384f2e.readdir(_0xd37d38, {
      withFileTypes: true,
    });
    const _0x27c5a7 = [];
    for (const _0x1dc789 of _0x51760b) {
      const _0x1d8552 = _0x4aeacc.join(_0xd37d38, _0x1dc789.name);
      if (_0x1dc789.isDirectory()) {
        _0x27c5a7.push(...(await this.getAllFiles(_0x1d8552)));
      } else {
        _0x27c5a7.push(_0x1d8552);
      }
    }
    return _0x27c5a7;
  }
  async ["installFantomeFile"](_0x1284ad) {
    await this.installLock.acquire();
    try {
      if (this.isInstalling) {
        throw new Error("Another installation is in progress");
      }
      this.isInstalling = true;
      const _0xc977e1 = this.tempPath;
      const _0x3ad05a = this.installedPath;
      this.sendStatus("Installation: Installing skin(s)...");
      await Promise.all([
        _0x384f2e
          .rm(_0xc977e1, {
            recursive: true,
            force: true,
          })
          ["catch"](() => {}),
        _0x384f2e
          .rm(_0x3ad05a, {
            recursive: true,
            force: true,
          })
          ["catch"](() => {}),
      ]);
      await Promise.all([
        _0x384f2e.mkdir(_0xc977e1, {
          recursive: true,
        }),
        _0x384f2e.mkdir(_0x3ad05a, {
          recursive: true,
        }),
      ]);
      const _0x13d610 = Array.from(_0x1284ad.entries());
      this.sendStatus(
        "Installation: Processing " + _0x13d610.length + " skin file(s)..."
      );
      for (const [_0x250665, _0x2c4343] of _0x13d610) {
        const _0x481694 = parseInt(_0x250665.split(".")[0]);
        const _0x1a4be7 = _0x4aeacc.join(_0xc977e1, _0x250665);
        const _0x6156be = _0x4aeacc.join(_0x3ad05a, _0x481694.toString());
        try {
          await _0x384f2e.writeFile(_0x1a4be7, _0x2c4343);
          await this.runTool([
            "import",
            _0x4aeacc.resolve(_0x1a4be7),
            _0x4aeacc.resolve(_0x6156be),
            "--game:" + _0x4aeacc.resolve(this.getLeaguePath()),
            "--ignoreConflict",
          ]);
          const _0x12d797 = _0x4aeacc.join(
            this.cachePath,
            _0x481694.toString()
          );
          await _0x384f2e
            .rm(_0x12d797, {
              recursive: true,
              force: true,
            })
            ["catch"](() => {});
          await this.encryptDirectory(_0x6156be, _0x12d797);
        } finally {
          await _0x384f2e.unlink(_0x1a4be7)["catch"](() => {});
        }
      }
      this.sendStatus(
        "Installation: Successfully installed " + _0x13d610.length + " skin(s)"
      );
    } catch (_0x12e303) {
      if (_0x12e303 instanceof Error) {
        const _0x41e318 = _0x12e303.message;
        if (
          _0x41e318.includes("disk space") ||
          _0x41e318.includes("space on the disk") ||
          _0x41e318.includes("There is not enough space") ||
          _0x41e318.includes("ENOSPC") ||
          _0x41e318.includes("impl_reserve")
        ) {
          const _0x26a883 = new Error(
            "Not enough disk space on C: drive. Please free up some space and try again."
          );
          this.sendStatus("Error installing skin(s): " + _0x26a883.message);
          throw _0x26a883;
        }
      }
      this.sendStatus(
        "Error installing skin(s): " +
          (_0x12e303?.["message"] || "Unknown error")
      );
      console.error("Installation error:", _0x12e303);
      throw _0x12e303;
    } finally {
      this.isInstalling = false;
      this.installLock.release();
      await _0x384f2e
        .rm(this.tempPath, {
          recursive: true,
          force: true,
        })
        ["catch"](() => {});
    }
  }
  ["emitStatus"](_0x43da10) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (!this.mainWindow.isMinimized()) {
        this.mainWindow.webContents.send("patcher-status", _0x43da10);
      } else if (
        _0x43da10.includes("Error:") ||
        _0x43da10.includes("Status: Stopping") ||
        _0x43da10.includes("[DLL] info: Init done!") ||
        _0x43da10.includes("[DLL] info: Exit in process!")
      ) {
        this.mainWindow.webContents.send("patcher-status", _0x43da10);
      }
    }
  }
  ["sendThrottledStatus"](_0x5872c0, _0x429e18 = false) {
    if (
      _0x429e18 ||
      _0x5872c0.includes("Error:") ||
      _0x5872c0.includes("Status: Starting") ||
      _0x5872c0.includes("Status: Stopping") ||
      _0x5872c0.includes("[DLL] info: Init done!") ||
      _0x5872c0.includes("[DLL] info: Exit in process!")
    ) {
      this.emitStatus(_0x5872c0);
      return;
    }
    const _0x277d9e = Date.now();
    if (this.mainWindow?.["isMinimized"]() && !_0x429e18) {
      return;
    }
    if (_0x5872c0.includes("[DLL]")) {
      if (!this.statusUpdateInterval) {
        this.statusUpdateInterval = setInterval(() => {
          if (this.statusQueue.length > 0) {
            this.emitStatus(this.statusQueue[this.statusQueue.length - 1]);
            this.statusQueue = [];
          } else if (Date.now() - this.lastStatusTime > 10000) {
            if (this.statusUpdateInterval) {
              clearInterval(this.statusUpdateInterval);
              this.statusUpdateInterval = null;
            }
          }
        }, this.STATUS_THROTTLE_MS);
      }
      this.statusQueue.push(_0x5872c0);
      this.lastStatusTime = _0x277d9e;
    } else if (_0x277d9e - this.lastStatusTime > 250) {
      this.emitStatus(_0x5872c0);
      this.lastStatusTime = _0x277d9e;
    }
  }
  ["clearStatusInterval"]() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
      this.statusQueue = [];
    }
  }
  ["sendStatus"](_0xeb828a) {
    this.sendThrottledStatus(_0xeb828a, false);
  }
  async ["loadAndRunMods"](_0xde90a7) {
    const _0x33a803 = this.profilesPath;
    try {
      this.sendStatus("Status: Creating profile...");
      const _0x389b6b = skinHelpers.getInstalledSkins("paid");
      const _0x5e3e49 = skinHelpers.getInstalledSkins("free");
      const _0x197441 = [..._0x389b6b, ..._0x5e3e49].map((_0x58cdb1) =>
        _0x58cdb1.toString()
      );
      const _0x3c8283 = _0xde90a7.filter((_0x3dd3de) =>
        _0x197441.includes(_0x3dd3de)
      );
      if (_0x3c8283.length === 0) {
        throw new Error(
          "None of the selected skins are installed. Please install the skins first."
        );
      }
      const _0x5ba614 = [];
      for (const _0x3fdc66 of _0x3c8283) {
        const _0xfa6ad8 = _0x4aeacc.join(this.cachePath, _0x3fdc66);
        const _0x1404b7 = _0x4aeacc.join(_0xfa6ad8, "data.mov");
        try {
          await _0x384f2e.access(_0x1404b7);
          _0x5ba614.push(_0x3fdc66);
        } catch (_0xbd93d5) {}
      }
      if (_0x5ba614.length === 0) {
        throw new Error(
          "None of the selected skins were found. Please reinstall the skins."
        );
      }
      await _0x384f2e.writeFile(
        _0x4aeacc.join(_0x33a803, "current.profile"),
        "Default Profile\n"
      );
      await _0x384f2e.writeFile(
        _0x4aeacc.join(_0x33a803, "Default Profile.profile"),
        _0x5ba614.join("\n") + "\n"
      );
      this.sendStatus("Status: Creating overlay...");
      const _0xeeab0b = _0x4aeacc.join(this.tempPath, "decrypted");
      await _0x384f2e.mkdir(_0xeeab0b, {
        recursive: true,
      });
      for (let _0x4f0fb5 = 0; _0x4f0fb5 < _0x5ba614.length; _0x4f0fb5 += 3) {
        const _0x52c01d = _0x5ba614.slice(_0x4f0fb5, _0x4f0fb5 + 3);
        await Promise.all(
          _0x52c01d.map(async (_0x4d8079) => {
            try {
              const _0x3f8e7a = _0x4aeacc.join(this.cachePath, _0x4d8079);
              const _0x2231fd = _0x4aeacc.join(_0xeeab0b, _0x4d8079);
              await this.decryptDirectory(_0x3f8e7a, _0x2231fd);
            } catch (_0xd46fcd) {}
          })
        );
      }
      const _0x1f9d7f = await _0x384f2e.readdir(_0xeeab0b);
      if (_0x1f9d7f.length === 0) {
        throw new Error("Please reinstall the skins.");
      }
      await this.runTool([
        "mkoverlay",
        _0xeeab0b,
        _0x4aeacc.join(_0x33a803, "Default Profile"),
        "--game:" + _0x4aeacc.resolve(this.getLeaguePath()),
        "--ignoreConflict",
        "--mods:" + _0x1f9d7f.join("/"),
      ]);
      await _0x384f2e.rm(_0xeeab0b, {
        recursive: true,
        force: true,
      });
      this.sendStatus("Status: Starting patcher...");
      this.patcherProcess = spawn(
        _0x4aeacc.join(this.toolsPath, "mod-tools.exe"),
        [
          "runoverlay",
          _0x4aeacc.join(_0x33a803, "Default Profile"),
          _0x4aeacc.join(_0x33a803, "Default Profile.config"),
          "--game:" + _0x4aeacc.resolve(this.getLeaguePath()),
          "--opts:none",
        ],
        {
          cwd: this.toolsPath,
          env: {
            ...globalThis.process.env,
            PATH: this.toolsPath + ";" + globalThis.process.env.PATH,
          },
        }
      );
      if (this.patcherProcess.stdout) {
        this.patcherProcess.stdout.on("data", (_0x273e80) => {
          const _0x11e665 = _0x273e80.toString().trim();
          console.log("Patcher output:", _0x11e665);
          if (_0x11e665.includes("Status:") || _0x11e665.includes("[DLL]")) {
            this.sendStatus(_0x11e665);
          }
          if (_0x11e665.includes("League of Legends process detected")) {
            this.sendStatus("Status: League client detected");
          }
          if (_0x11e665.includes("Waiting for game to start")) {
            this.sendStatus("Status: Waiting for match to start");
          }
          if (_0x11e665.includes("[DLL] info: Init done!")) {
            this.minimizeWindow();
          }
        });
      }
      if (this.patcherProcess.stderr) {
        this.patcherProcess.stderr.on("data", (_0x345914) => {
          const _0x252c77 = _0x345914.toString().trim();
          console.error("Patcher error:", _0x252c77);
          this.sendStatus("Error: " + _0x252c77);
        });
      }
      this.patcherProcess.on("error", (_0x56bd00) => {
        console.error("Patcher process error:", _0x56bd00);
        this.sendStatus("Error: " + _0x56bd00.message);
      });
      this.patcherProcess.on("exit", (_0x1fbc8b) => {
        console.log("Patcher process exited with code " + _0x1fbc8b);
        this.patcherProcess = null;
        if (_0x1fbc8b !== 0) {
          this.sendStatus("Error: Patcher exited with code " + _0x1fbc8b);
        } else {
          this.sendStatus("Status: Patcher exited successfully");
        }
      });
      this.sendStatus("Status: Patcher started");
    } catch (_0x2af940) {
      console.error("Error loading and running mods:", _0x2af940);
      this.sendStatus(
        "Error: " +
          (_0x2af940 instanceof Error ? _0x2af940.message : "Unknown error")
      );
      throw _0x2af940;
    }
  }
  async ["stopPatcher"]() {
    try {
      this.clearStatusInterval();
      if (this.patcherProcess) {
        this.sendStatus("Status: Stopping patcher...");
        if (this.patcherProcess.stdin?.["writable"]) {
          this.patcherProcess.stdin.write("\n");
        }
        await Promise.race([
          new Promise((_0x1eb300, _0x1420b9) => {
            if (this.patcherProcess) {
              this.patcherProcess.once("exit", () => {
                _0x1eb300();
              });
              this.patcherProcess.once("error", (_0x25290d) => {
                _0x1420b9(_0x25290d);
              });
            } else {
              _0x1eb300();
            }
          }),
          new Promise((_0x5d8ebc) => {
            setTimeout(() => {
              if (this.patcherProcess) {
                this.patcherProcess.kill("SIGTERM");
                setTimeout(() => {
                  if (this.patcherProcess) {
                    this.patcherProcess.kill("SIGKILL");
                  }
                  _0x5d8ebc();
                }, 1000);
              } else {
                _0x5d8ebc();
              }
            }, 3000);
          }),
        ]);
        await this.killOrphanedProcesses();
        this.sendStatus("Status: Patcher stopped");
        if (this.patcherProcess) {
          this.patcherProcess.removeAllListeners();
          this.patcherProcess = null;
        }
      } else {
      }
      await this.cleanProfileFiles();
    } catch (_0x419e8f) {
      this.sendStatus(
        "Error: Failed to stop patcher - " +
          (_0x419e8f instanceof Error ? _0x419e8f.message : "Unknown error")
      );
      throw _0x419e8f;
    } finally {
      if (this.patcherProcess) {
        this.patcherProcess.removeAllListeners();
        this.patcherProcess = null;
      }
    }
  }
  async ["cleanProfileFiles"]() {
    try {
      const _0x31331f = Array.from(this.sessionDirectories.entries()).find(
        ([_0x27dd8c, _0x2d747b]) => _0x2d747b === "profiles"
      )?.[0];
      if (!_0x31331f) {
        throw new Error("Profiles directory not found");
      }
      const _0x711b39 = await _0x384f2e
        .access(_0x31331f)
        .then(() => true)
        ["catch"](() => false);
      if (_0x711b39) {
        await _0x384f2e.rm(_0x31331f, {
          recursive: true,
          force: true,
        });
      } else {
      }
      this.sessionDirectories["delete"](_0x31331f);
      this.profilesPath = this.generateRandomPath("profiles");
      await _0x384f2e.mkdir(this.profilesPath, {
        recursive: true,
        mode: 0x1c0,
      });
    } catch (_0x107f48) {
      throw _0x107f48;
    }
  }
  async ["cleanupSessionDirectories"](_0x597a73) {
    if (_0x597a73) {
      for (const [_0x2b2950, _0x2d1adb] of this.sessionDirectories) {
        if (_0x597a73.includes(_0x2d1adb) && _0x2d1adb !== "cache") {
          try {
            const _0x229381 = await _0x384f2e
              .access(_0x2b2950)
              .then(() => true)
              ["catch"](() => false);
            if (_0x229381) {
              await _0x384f2e.rm(_0x2b2950, {
                recursive: true,
                force: true,
              });
            }
          } catch (_0x3492a6) {}
        }
      }
    } else {
      for (const [_0x1281c5, _0xab38c9] of this.sessionDirectories) {
        if (_0xab38c9 !== "cache") {
          try {
            if (_0x1281c5.includes("celestial-launcher")) {
              const _0x13e833 = _0x4aeacc.dirname(_0x4aeacc.dirname(_0x1281c5));
              const _0xeca973 = await _0x384f2e
                .access(_0x13e833)
                .then(() => true)
                ["catch"](() => false);
              if (_0xeca973) {
                await _0x384f2e.rm(_0x13e833, {
                  recursive: true,
                  force: true,
                });
                for (const [_0x6e7bcd, _0x4d16df] of this.sessionDirectories) {
                  if (_0x6e7bcd.startsWith(_0x13e833)) {
                    this.sessionDirectories["delete"](_0x6e7bcd);
                  }
                }
                break;
              }
            } else {
              const _0xdb007f = await _0x384f2e
                .access(_0x1281c5)
                .then(() => true)
                ["catch"](() => false);
              if (_0xdb007f) {
                await _0x384f2e.rm(_0x1281c5, {
                  recursive: true,
                  force: true,
                });
                this.sessionDirectories["delete"](_0x1281c5);
              }
            }
          } catch (_0x407cda) {}
        }
      }
    }
  }
  async ["cleanup"]() {
    try {
      if (this.patcherProcess) {
        await this.stopPatcher();
      }
      await this.cleanupSessionDirectories();
      await this.killOrphanedProcesses();
    } catch (_0x4a8099) {}
  }
  async ["killOrphanedProcesses"]() {
    try {
      const _0x27999f = process.platform === "win32";
      if (_0x27999f) {
        await new Promise((_0x1438b2, _0x3dd217) => {
          const _0x4588e4 = spawn("taskkill", ["/F", "/IM", "mod-tools.exe"]);
          _0x4588e4.on("exit", (_0x3cfe8f) => {
            if (_0x3cfe8f === 0 || _0x3cfe8f === 128) {
              _0x1438b2();
            } else {
              _0x3dd217(new Error("taskkill failed with code " + _0x3cfe8f));
            }
          });
        });
      }
    } catch (_0x5f5d11) {
      console.error("Error killing orphaned processes:", _0x5f5d11);
    }
  }
  ["getInstalledPath"]() {
    return this.installedPath;
  }
  ["getCachePath"]() {
    return this.cachePath;
  }
  ["getTempPath"]() {
    return this.tempPath;
  }
  async ["verifySkinExists"](_0x17b295) {
    try {
      const _0x5c55c7 = _0x4aeacc.join(this.getCachePath(), _0x17b295);
      const _0x5172bc = _0x4aeacc.join(_0x5c55c7, "data.mov");
      await _0x384f2e.access(_0x5c55c7);
      await _0x384f2e.access(_0x5172bc);
      return true;
    } catch (_0x43ce45) {
      return false;
    }
  }
  ["getProfilesPath"]() {
    return this.profilesPath;
  }
  ["getCacheParentDir"]() {
    const _0x46fa72 = this.cachePath;
    return _0x4aeacc.dirname(_0x46fa72);
  }
  async ["cleanupProfiles"]() {
    await this.cleanProfileFiles();
  }
  async ["repairInstalledSkins"]() {
    try {
      this.emitStatus("Installation: Starting skin repair...");
      const _0x1d71c9 = await skinHelpers.getInstalledSkins("paid");
      const _0x26684c = await skinHelpers.getInstalledSkins("free");
      const _0x33d5a8 = _0x1d71c9.length + _0x26684c.length;
      if (_0x33d5a8 === 0) {
        this.emitStatus("Installation: No paid or free skins to repair");
        return;
      }
      this.emitStatus("Installation: Repairing " + _0x33d5a8 + " skins...");
      let _0x1ec758 = 0;
      for (const _0x4cd98b of _0x1d71c9) {
        try {
          this.emitStatus(
            "Installation: Repairing paid skin " +
              _0x4cd98b +
              " (" +
              ++_0x1ec758 +
              "/" +
              _0x33d5a8 +
              ")"
          );
          const _0x6ecfd2 = await skinService.fetchFantomeFiles([_0x4cd98b]);
          await this.installFantomeFile(_0x6ecfd2);
          this.emitStatus(
            "Installation: Successfully repaired paid skin " + _0x4cd98b
          );
        } catch (_0x1573d4) {
          console.error(
            "Error repairing paid skin " + _0x4cd98b + ":",
            _0x1573d4
          );
          this.emitStatus(
            "Installation Error: Paid skin " +
              _0x4cd98b +
              ": " +
              (_0x1573d4 instanceof Error
                ? _0x1573d4.message
                : String(_0x1573d4))
          );
        }
      }
      for (const _0x5064b0 of _0x26684c) {
        try {
          this.emitStatus(
            "Installation: Repairing free skin " +
              _0x5064b0 +
              " (" +
              ++_0x1ec758 +
              "/" +
              _0x33d5a8 +
              ")"
          );
          const _0xa0c15f = await skinService.fetchFantomeFiles([_0x5064b0]);
          await this.installFantomeFile(_0xa0c15f);
          this.emitStatus(
            "Installation: Successfully repaired free skin " + _0x5064b0
          );
        } catch (_0x307a81) {
          console.error(
            "Error repairing free skin " + _0x5064b0 + ":",
            _0x307a81
          );
          this.emitStatus(
            "Installation Error: Free skin " +
              _0x5064b0 +
              ": " +
              (_0x307a81 instanceof Error
                ? _0x307a81.message
                : String(_0x307a81))
          );
        }
      }
      this.emitStatus(
        "Installation: Completed repairing " + _0x33d5a8 + " skins"
      );
    } catch (_0xd8f03b) {
      console.error("Error repairing skins:", _0xd8f03b);
      this.emitStatus(
        "Installation Error: " +
          (_0xd8f03b instanceof Error ? _0xd8f03b.message : String(_0xd8f03b))
      );
      throw _0xd8f03b;
    }
  }
  ["setMainWindow"](_0x54e818) {
    this.mainWindow = _0x54e818;
  }
  ["minimizeWindow"]() {
    if (
      this.mainWindow &&
      !this.mainWindow.isDestroyed() &&
      !this.mainWindow.isMinimized()
    ) {
      console.log("Minimizing window as game has started");
      this.mainWindow.minimize();
    }
  }
}
export const cslolService = new CslolService();
