import _0x2301fa from "path";
import _0x5bff56 from "fs/promises";
import _0x19f8b4 from "crypto";
import { leaguePathService } from "./leaguePathService.js";
import { spawn } from "child_process";
import { resourceManager } from "./resourceManager.js";
import { store } from "../store.js";
import { app } from "electron";
export class ImportService {
  constructor() {
    this.patcherProcess = null;
    this.isPatcherRunning = false;
    this.lastStatusTime = 0;
    this.STATUS_THROTTLE_MS = 500;
    this.toolsPath = _0x2301fa.dirname(
      resourceManager.getToolPath("mod-tools.exe")
    );
    this.importedPath = _0x2301fa.join(this.toolsPath, "imported");
    this.tempDir = _0x2301fa.join(this.toolsPath, "import-temp");
    this.installedDir = _0x2301fa.join(this.toolsPath, "import-installed");
    this.profilesDir = _0x2301fa.join(this.toolsPath, "profiles");
    this.backupPath = _0x2301fa.join(
      app.getPath("userData"),
      "imported-skins-backup"
    );
    this.ensureDirectoryStructure();
  }
  async ["ensureDirectoryStructure"]() {
    const _0x28c3e7 = [
      this.importedPath,
      this.tempDir,
      this.installedDir,
      this.profilesDir,
      this.backupPath,
    ];
    for (const _0x591afd of _0x28c3e7) {
      try {
        await _0x5bff56.mkdir(_0x591afd, {
          recursive: true,
          mode: 0x1ff,
        });
        await _0x5bff56.chmod(_0x591afd, 511);
      } catch (_0xf3f516) {
        console.error("Error creating directory " + _0x591afd + ":", _0xf3f516);
      }
    }
  }
  async ["cleanup"]() {
    const _0x5e56dd = [this.tempDir, this.installedDir];
    for (const _0x522b6f of _0x5e56dd) {
      try {
        await _0x5bff56.rm(_0x522b6f, {
          recursive: true,
          force: true,
        });
        await _0x5bff56.mkdir(_0x522b6f, {
          recursive: true,
        });
        await _0x5bff56.chmod(_0x522b6f, 511);
      } catch (_0x114b87) {
        console.error("Error cleaning directory " + _0x522b6f + ":", _0x114b87);
      }
    }
  }
  async ["runTool"](_0x33d050) {
    return new Promise((_0x286cd7, _0x40ac60) => {
      const _0x176836 = _0x2301fa.join(this.toolsPath, "mod-tools.exe");
      console.log("Running tool:", _0x176836);
      console.log("With args:", _0x33d050);
      console.log("Working directory:", this.toolsPath);
      console.log(
        "Environment PATH:",
        this.toolsPath + ";" + globalThis.process.env.PATH
      );
      if (!_0x5bff56.access(_0x176836)) {
        _0x40ac60(new Error("mod-tools.exe not found at " + _0x176836));
        return;
      }
      const _0x19b9aa = _0x2301fa.join(this.toolsPath, "cslol-dll.dll");
      if (!_0x5bff56.access(_0x19b9aa)) {
        _0x40ac60(new Error("cslol-dll.dll not found at " + _0x19b9aa));
        return;
      }
      const _0x2b2c31 = spawn(_0x176836, _0x33d050, {
        cwd: this.toolsPath,
        env: {
          ...globalThis.process.env,
          PATH: this.toolsPath + ";" + globalThis.process.env.PATH,
        },
      });
      let _0x5683fa = "";
      if (_0x2b2c31.stdout) {
        _0x2b2c31.stdout.on("data", (_0x137531) => {
          console.log("Tool output:", _0x137531.toString().trim());
        });
      }
      if (_0x2b2c31.stderr) {
        _0x2b2c31.stderr.on("data", (_0x4d698a) => {
          const _0x5d56b2 = _0x4d698a.toString().trim();
          console.log("Tool error:", _0x5d56b2);
          _0x5683fa += _0x5d56b2 + "\n";
        });
      }
      _0x2b2c31.on("close", (_0x14391f) => {
        if (_0x14391f !== 0) {
          console.log("Process failed with:");
          console.log("Exit code:", _0x14391f);
          _0x40ac60(new Error("Process failed with code " + _0x14391f));
        } else {
          _0x286cd7();
        }
      });
      _0x2b2c31.on("error", (_0x9ee907) => {
        console.error("Failed to start process:", _0x9ee907);
        _0x40ac60(_0x9ee907);
      });
    });
  }
  ["generateId"](_0x387933) {
    return _0x19f8b4.createHash("md5").update(_0x387933).digest("hex");
  }
  async ["sleep"](_0xd8d4d8) {
    return new Promise((_0x50c6eb) => setTimeout(_0x50c6eb, _0xd8d4d8));
  }
  async ["skinExists"](_0x3c54d5) {
    try {
      const _0x4f75a1 = _0x2301fa.join(this.importedPath, _0x3c54d5);
      const _0x32b80f = _0x2301fa.join(_0x4f75a1, "META", "info.json");
      await _0x5bff56.access(_0x4f75a1);
      await _0x5bff56.access(_0x32b80f);
      return true;
    } catch (_0x1d073c) {
      return false;
    }
  }
  async ["importFantomeFiles"](_0x25a75d) {
    console.log(
      "importFantomeFiles called with " + _0x25a75d.length + " files:",
      _0x25a75d.map((_0x5ce1dc) => _0x5ce1dc.name)
    );
    if (this.isPatcherRunning) {
      console.log("Cannot import skins while patcher is running");
      throw new Error("Cannot import skins while patcher is running");
    }
    const _0x3e8a9e = await leaguePathService.getLeaguePath();
    if (!_0x3e8a9e) {
      console.log("League of Legends path not set");
      throw new Error("League of Legends path not set");
    }
    const _0x18a13d = _0x2301fa.resolve(_0x2301fa.dirname(_0x3e8a9e));
    console.log("Game directory:", _0x18a13d);
    try {
      console.log(
        "Starting import process with files:",
        _0x25a75d.map((_0x37cf56) => _0x37cf56.name)
      );
      const _0xd33a0f = [];
      const _0x3782f9 = [];
      const _0x1ae25c = [];
      for (const _0x216b28 of [this.tempDir, this.installedDir]) {
        console.log("Cleaning directory: " + _0x216b28);
        await _0x5bff56
          .rm(_0x216b28, {
            recursive: true,
            force: true,
          })
          ["catch"]((_0x32837c) => {
            console.warn(
              "Failed to remove directory " + _0x216b28 + ":",
              _0x32837c
            );
          });
        await _0x5bff56.mkdir(_0x216b28, {
          recursive: true,
        });
        await _0x5bff56
          .chmod(_0x216b28, 511)
          ["catch"]((_0x578e3f) =>
            console.warn(
              "Failed to set permissions for " + _0x216b28 + ":",
              _0x578e3f
            )
          );
      }
      const _0x23524c = _0x25a75d.filter((_0x47cc2c) => {
        const _0x50eb2a = _0x47cc2c.name.toLowerCase();
        const _0x25f001 =
          _0x50eb2a.endsWith(".fantome") ||
          _0x50eb2a.endsWith(".zip") ||
          _0x50eb2a.endsWith(".wad") ||
          _0x50eb2a.endsWith(".client");
        if (!_0x25f001) {
          console.log("Skipping invalid file:", _0x47cc2c.name);
          _0x3782f9.push(_0x47cc2c.name + " (not a supported file type)");
        }
        return _0x25f001;
      });
      if (_0x23524c.length === 0) {
        console.log("No valid files to import");
        throw new Error(
          "No valid files to import. Supported formats: .fantome, .zip, .wad, .client"
        );
      }
      for (const { name: _0x1db318, buffer: _0xa15d } of _0x23524c) {
        console.log(
          "Processing file: " +
            _0x1db318 +
            " (" +
            _0xa15d.byteLength +
            " bytes)"
        );
        const _0x3cbe8d = this.generateId(_0x1db318);
        const _0x9a21d = _0x2301fa.join(this.tempDir, _0x1db318);
        const _0x4276fb = _0x2301fa.join(this.installedDir, _0x3cbe8d);
        console.log("Generated ID: " + _0x3cbe8d);
        console.log("Temp path: " + _0x9a21d);
        console.log("Destination path: " + _0x4276fb);
        try {
          if (await this.skinExists(_0x3cbe8d)) {
            console.log("Skin " + _0x3cbe8d + " already exists");
            _0x1ae25c.push(_0x3cbe8d);
            continue;
          }
          console.log("Writing file to " + _0x9a21d);
          await _0x5bff56.writeFile(_0x9a21d, Buffer.from(_0xa15d));
          await _0x5bff56
            .chmod(_0x9a21d, 438)
            ["catch"]((_0xd65efa) =>
              console.warn(
                "Failed to set file permissions for " + _0x9a21d + ":",
                _0xd65efa
              )
            );
          console.log("Cleaning destination directory: " + _0x4276fb);
          await _0x5bff56
            .rm(_0x4276fb, {
              recursive: true,
              force: true,
            })
            ["catch"]((_0x21b593) => {
              console.warn(
                "Failed to remove directory " + _0x4276fb + ":",
                _0x21b593
              );
            });
          console.log("Running import tool for " + _0x1db318);
          await this.runTool([
            "import",
            _0x2301fa.resolve(_0x9a21d),
            _0x2301fa.resolve(_0x4276fb),
            "--game:" + _0x2301fa.resolve(_0x18a13d),
            "--ignoreConflict",
          ]);
          const _0x261f08 = _0x2301fa.join(this.importedPath, _0x3cbe8d);
          console.log("Creating final imported directory: " + _0x261f08);
          await _0x5bff56
            .rm(_0x261f08, {
              recursive: true,
              force: true,
            })
            ["catch"]((_0x1d8367) => {
              console.warn(
                "Failed to remove directory " + _0x261f08 + ":",
                _0x1d8367
              );
            });
          await _0x5bff56.mkdir(_0x2301fa.dirname(_0x261f08), {
            recursive: true,
          });
          await _0x5bff56
            .chmod(_0x2301fa.dirname(_0x261f08), 511)
            ["catch"]((_0x359e12) =>
              console.warn(
                "Failed to set directory permissions for " +
                  _0x2301fa.dirname(_0x261f08) +
                  ":",
                _0x359e12
              )
            );
          console.log("Copying from " + _0x4276fb + " to " + _0x261f08);
          await _0x5bff56.cp(_0x4276fb, _0x261f08, {
            recursive: true,
          });
          await _0x5bff56
            .chmod(_0x261f08, 511)
            ["catch"]((_0x11c7a0) =>
              console.warn(
                "Failed to set permissions for " + _0x261f08 + ":",
                _0x11c7a0
              )
            );
          const _0x288714 = _0x2301fa.join(_0x261f08, "META", "info.json");
          console.log("Reading skin info from " + _0x288714);
          try {
            await _0x5bff56.access(_0x288714);
          } catch (_0x28c578) {
            console.error("Missing META/info.json in " + _0x1db318);
            throw new Error(
              "Invalid skin format: Missing META/info.json in " + _0x1db318
            );
          }
          let _0x32f8c0;
          try {
            const _0x490b05 = await _0x5bff56.readFile(_0x288714, "utf-8");
            _0x32f8c0 = JSON.parse(_0x490b05);
            console.log("Parsed info.json for " + _0x1db318 + ":", _0x32f8c0);
          } catch (_0x361565) {
            console.error(
              "Could not parse META/info.json in " + _0x1db318 + ":",
              _0x361565
            );
            throw new Error(
              "Invalid skin format: Could not parse META/info.json in " +
                _0x1db318
            );
          }
          const _0x3cd872 = {
            id: _0x3cbe8d,
            name: _0x32f8c0.Name || _0x2301fa.basename(_0x1db318, ".fantome"),
            author: _0x32f8c0.Author || "Unknown",
            description: _0x32f8c0.Description || "",
            version: _0x32f8c0.Version || "1.0.0",
            filePath: _0x261f08,
            type: "imported",
          };
          console.log("Created skin object:", _0x3cd872);
          _0xd33a0f.push(_0x3cd872);
          this.sendThrottledStatus(
            "Successfully imported skin: " + _0x3cd872.name
          );
          console.log(
            "Successfully imported skin: " +
              _0x3cd872.name +
              " (" +
              _0x3cbe8d +
              ")"
          );
        } catch (_0x2880ac) {
          console.error("Error importing skin " + _0x1db318 + ":", _0x2880ac);
          _0x3782f9.push(
            _0x1db318 +
              " (" +
              (_0x2880ac instanceof Error
                ? _0x2880ac.message
                : "Unknown error") +
              ")"
          );
          console.log("Cleaning up partial import for " + _0x3cbe8d);
          await _0x5bff56
            .rm(_0x2301fa.join(this.importedPath, _0x3cbe8d), {
              recursive: true,
              force: true,
            })
            ["catch"]((_0x5cb3da) => {
              console.warn(
                "Failed to remove directory " +
                  _0x2301fa.join(this.importedPath, _0x3cbe8d) +
                  ":",
                _0x5cb3da
              );
            });
          continue;
        } finally {
          console.log("Cleaning up temp file: " + _0x9a21d);
          await _0x5bff56.unlink(_0x9a21d)["catch"]((_0x26b8ad) => {
            console.warn("Failed to remove file " + _0x9a21d + ":", _0x26b8ad);
          });
        }
      }
      if (_0x3782f9.length > 0 || _0x1ae25c.length > 0) {
        if (_0x3782f9.length > 0) {
          console.warn("Some skins failed to import:", _0x3782f9);
        }
        if (_0x1ae25c.length > 0) {
          console.warn("Some skins were already imported:", _0x1ae25c);
        }
        if (_0xd33a0f.length === 0) {
          if (_0x1ae25c.length > 0 && _0x3782f9.length === 0) {
            console.error("All skins were already imported");
            throw new Error("All skins were already imported");
          } else {
            if (_0x1ae25c.length > 0 && _0x3782f9.length > 0) {
              console.error(
                "Failed to import skins: Some were duplicates and others failed"
              );
              throw new Error(
                "Failed to import skins: Some were duplicates and others failed"
              );
            } else {
              console.error(
                "Failed to import all skins: " + _0x3782f9.join(", ")
              );
              throw new Error(
                "Failed to import all skins: " + _0x3782f9.join(", ")
              );
            }
          }
        }
      }
      console.log(
        "Import process completed successfully with " +
          _0xd33a0f.length +
          " skins"
      );
      return _0xd33a0f;
    } catch (_0x224dda) {
      console.error("Error in importFantomeFiles:", _0x224dda);
      throw _0x224dda;
    } finally {
      for (const _0x37c886 of [this.tempDir, this.installedDir]) {
        await _0x5bff56
          .rm(_0x37c886, {
            recursive: true,
            force: true,
          })
          ["catch"](() => {});
      }
    }
  }
  async ["getImportedSkins"]() {
    const _0x5c6184 = [];
    try {
      const _0x196b08 = await _0x5bff56.readdir(this.importedPath, {
        withFileTypes: true,
      });
      for (const _0x5f4b8f of _0x196b08) {
        if (!_0x5f4b8f.isDirectory()) {
          continue;
        }
        try {
          const _0x4e254b = _0x2301fa.join(
            this.importedPath,
            _0x5f4b8f.name,
            "META",
            "info.json"
          );
          const _0x2ccc98 = JSON.parse(
            await _0x5bff56.readFile(_0x4e254b, "utf-8")
          );
          _0x5c6184.push({
            id: _0x5f4b8f.name,
            name: _0x2ccc98.Name || "Unknown",
            author: _0x2ccc98.Author || "Unknown",
            description: _0x2ccc98.Description || "",
            version: _0x2ccc98.Version || "1.0.0",
            filePath: _0x2301fa.join(this.importedPath, _0x5f4b8f.name),
          });
        } catch (_0x3f5f98) {
          console.error(
            "Error reading skin " + _0x5f4b8f.name + ":",
            _0x3f5f98
          );
        }
      }
    } catch (_0x1b3b6b) {
      console.error("Error reading imported skins directory:", _0x1b3b6b);
    }
    return _0x5c6184;
  }
  async ["removeImportedSkin"](_0x27027d) {
    if (this.isPatcherRunning) {
      throw new Error("Cannot remove skin while patcher is running");
    }
    try {
      const _0xedda4 = _0x2301fa.join(this.importedPath, _0x27027d);
      const _0x238b3c = await _0x5bff56
        .access(_0xedda4)
        .then(() => true)
        ["catch"](() => false);
      if (!_0x238b3c) {
        throw new Error("Skin not found");
      }
      const _0x3ece76 = _0x2301fa.join(this.installedDir, _0x27027d);
      await _0x5bff56
        .rm(_0x3ece76, {
          recursive: true,
          force: true,
        })
        ["catch"](() => {});
      await _0x5bff56.rm(_0xedda4, {
        recursive: true,
        force: true,
      });
      const _0x54ee9a = store.get("activeSkins.imported") || {};
      if (_0x54ee9a[_0x27027d]) {
        delete _0x54ee9a[_0x27027d];
        store.set("activeSkins.imported", _0x54ee9a);
        console.log(
          "Removed skin " + _0x27027d + " from active imported skins in store"
        );
      }
    } catch (_0x1303b7) {
      console.error(
        "Error removing imported skin " + _0x27027d + ":",
        _0x1303b7
      );
      throw _0x1303b7;
    }
  }
  async ["getLeaguePath"]() {
    const _0x345c56 = await leaguePathService.getLeaguePath();
    if (!_0x345c56) {
      throw new Error("League of Legends path not set");
    }
    return _0x2301fa.dirname(_0x345c56);
  }
  ["sendStatus"](_0x5d2b6d) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (!this.mainWindow.isMinimized()) {
        this.mainWindow.webContents.send("patcher-status", _0x5d2b6d);
      } else if (
        _0x5d2b6d.includes("Error:") ||
        _0x5d2b6d.includes("Status: Stopping") ||
        _0x5d2b6d.includes("[DLL] info: Init done!") ||
        _0x5d2b6d.includes("[DLL] info: Exit in process!")
      ) {
        this.mainWindow.webContents.send("patcher-status", _0x5d2b6d);
      }
    }
  }
  ["sendThrottledStatus"](_0x4c03db, _0x3703ba = false) {
    if (
      _0x3703ba ||
      _0x4c03db.includes("Error:") ||
      _0x4c03db.includes("Status: Starting") ||
      _0x4c03db.includes("Status: Stopping") ||
      _0x4c03db.includes("[DLL] info: Init done!") ||
      _0x4c03db.includes("[DLL] info: Exit in process!")
    ) {
      this.sendStatus(_0x4c03db);
      return;
    }
    if (this.mainWindow?.["isMinimized"]() && !_0x3703ba) {
      return;
    }
    const _0x96b5ae = Date.now();
    if (_0x4c03db.includes("[DLL]")) {
      if (_0x96b5ae - this.lastStatusTime > this.STATUS_THROTTLE_MS) {
        this.sendStatus(_0x4c03db);
        this.lastStatusTime = _0x96b5ae;
      }
    } else if (_0x96b5ae - this.lastStatusTime > 250) {
      this.sendStatus(_0x4c03db);
      this.lastStatusTime = _0x96b5ae;
    }
  }
  ["clearStatusTimers"]() {
    this.lastStatusTime = 0;
  }
  async ["processSkinBatch"](_0x4f583e) {
    const _0x7dd45 = _0x4f583e.map(async (_0x19f5d0) => {
      const _0x40b9e3 = _0x2301fa.join(this.importedPath, _0x19f5d0);
      const _0x5b49c0 = _0x2301fa.join(this.installedDir, _0x19f5d0);
      await _0x5bff56.cp(_0x40b9e3, _0x5b49c0, {
        recursive: true,
      });
      await _0x5bff56.chmod(_0x5b49c0, 511);
    });
    await Promise.all(_0x7dd45);
  }
  ["isPatcherActive"]() {
    return this.isPatcherRunning;
  }
  async ["useImportedSkins"](_0x3b290f) {
    if (this.isPatcherRunning) {
      throw new Error("Patcher is already running");
    }
    try {
      this.isPatcherRunning = true;
      this.sendThrottledStatus("Status: Creating profile...", true);
      const _0x1ca202 = _0x2301fa.join(this.toolsPath, "profiles");
      await _0x5bff56.writeFile(
        _0x2301fa.join(this.toolsPath, "current.profile"),
        "Imported Profile\n"
      );
      await _0x5bff56.writeFile(
        _0x2301fa.join(_0x1ca202, "Imported Profile.profile"),
        _0x3b290f.join("\n") + "\n"
      );
      const _0x39e28a = [];
      for (let _0x57738d = 0; _0x57738d < _0x3b290f.length; _0x57738d += 3) {
        const _0xc52013 = _0x3b290f.slice(
          _0x57738d,
          Math.min(_0x57738d + 3, _0x3b290f.length)
        );
        _0x39e28a.push(_0xc52013);
      }
      this.sendThrottledStatus("Status: Installing skins...", true);
      await Promise.all(
        _0x39e28a.map((_0x3351ae) => this.processSkinBatch(_0x3351ae))
      );
      this.sendThrottledStatus("Status: Creating overlay...", true);
      await this.runTool([
        "mkoverlay",
        this.importedPath,
        "./profiles/Imported Profile",
        "--game:" + _0x2301fa.resolve(await this.getLeaguePath()),
        "--ignoreConflict",
        "--mods:" + _0x3b290f.join("/"),
      ]);
      this.sendThrottledStatus("Status: Starting patcher...", true);
      this.patcherProcess = spawn(
        _0x2301fa.join(this.toolsPath, "mod-tools.exe"),
        [
          "runoverlay",
          "./profiles/Imported Profile",
          "./profiles/Imported Profile.config",
          "--game:" + _0x2301fa.resolve(await this.getLeaguePath()),
          "--opts:none",
        ],
        {
          cwd: this.toolsPath,
          env: {
            ...process.env,
            PATH: this.toolsPath + ";" + process.env.PATH,
            CSLOL_DISABLE_CLEANUP: "1",
          },
          stdio: ["pipe", "pipe", "pipe"],
        }
      );
      let _0x305f8c = "";
      let _0x168a97 = false;
      if (this.patcherProcess.stdout) {
        this.patcherProcess.stdout.on("data", (_0xa65634) => {
          const _0x2cff0f = _0xa65634.toString();
          _0x305f8c += _0x2cff0f;
          if (_0x305f8c.includes("\n") || _0x305f8c.length > 1024) {
            const _0x313a18 = _0x305f8c.split("\n");
            _0x305f8c = _0x313a18.pop() || "";
            for (const _0x4ee2d7 of _0x313a18) {
              const _0x44a926 = _0x4ee2d7.trim();
              if (!_0x44a926) {
                continue;
              }
              if (_0x44a926.includes("[DLL] info: Init done!")) {
                _0x168a97 = true;
                this.sendThrottledStatus(_0x44a926, true);
                this.minimizeWindow();
              } else {
                if (_0x44a926.includes("[DLL] info: Exit in process!")) {
                  _0x168a97 = false;
                  this.sendThrottledStatus(_0x44a926, true);
                } else {
                  if (_0x44a926.includes("Error:")) {
                    this.sendThrottledStatus(_0x44a926, true);
                  } else if (_0x168a97 && _0x44a926.includes("[DLL]")) {
                    this.sendThrottledStatus(_0x44a926, false);
                  } else {
                    this.sendThrottledStatus(_0x44a926, false);
                  }
                }
              }
            }
          }
        });
      }
      if (this.patcherProcess.stderr) {
        this.patcherProcess.stderr.on("data", (_0x2dee3e) => {
          const _0x3b3a78 = _0x2dee3e.toString().trim();
          this.sendThrottledStatus("Error: " + _0x3b3a78, true);
        });
      }
      this.patcherProcess.on("error", (_0x2be0eb) => {
        console.error("Failed to start patcher:", _0x2be0eb);
        this.sendThrottledStatus(
          "Error: Failed to start patcher - " + _0x2be0eb.message,
          true
        );
        throw _0x2be0eb;
      });
      this.patcherProcess.on("exit", (_0x1322c8) => {
        this.isPatcherRunning = false;
        if (_0x1322c8 !== 0) {
          this.sendThrottledStatus(
            "Error: Patcher exited with code " + _0x1322c8,
            true
          );
          throw new Error("Patcher exited with code " + _0x1322c8);
        }
        this.patcherProcess = null;
        this.sendThrottledStatus("Status: Patcher exited successfully", true);
      });
    } catch (_0x40c2bf) {
      this.isPatcherRunning = false;
      console.error("Error in running imported mods:", _0x40c2bf);
      this.sendThrottledStatus(
        "Error: " +
          (_0x40c2bf instanceof Error
            ? _0x40c2bf.message
            : "Unknown error occurred"),
        true
      );
      throw _0x40c2bf;
    }
  }
  async ["stopPatcher"]() {
    try {
      this.clearStatusTimers();
      if (this.patcherProcess) {
        this.sendThrottledStatus("Status: Stopping patcher...", true);
        if (this.patcherProcess.stdin?.["writable"]) {
          this.patcherProcess.stdin.write("\n");
          await Promise.race([
            new Promise((_0x199a15) => {
              this.patcherProcess?.["once"]("exit", () => {
                console.log("Import patcher process exited normally");
                _0x199a15();
              });
            }),
            new Promise((_0x13e05b) => {
              setTimeout(() => {
                console.log("Import patcher exit timeout - forcing kill");
                if (this.patcherProcess) {
                  this.patcherProcess.kill("SIGTERM");
                  setTimeout(() => {
                    if (this.patcherProcess) {
                      console.log(
                        "Import patcher still running after SIGTERM - using SIGKILL"
                      );
                      this.patcherProcess.kill("SIGKILL");
                    }
                    _0x13e05b();
                  }, 2000);
                } else {
                  _0x13e05b();
                }
              }, 5000);
            }),
          ]);
        } else {
          this.patcherProcess.kill("SIGTERM");
        }
        if (this.patcherProcess) {
          this.patcherProcess.removeAllListeners();
        }
      } else {
        console.log("No import patcher process found to stop");
      }
      this.sendThrottledStatus("Status: Patcher stopped", true);
    } catch (_0x5bde18) {
      console.error("Error stopping import patcher:", _0x5bde18);
      this.sendThrottledStatus(
        "Error: Failed to stop patcher - " +
          (_0x5bde18 instanceof Error ? _0x5bde18.message : "Unknown error"),
        true
      );
      throw _0x5bde18;
    } finally {
      this.isPatcherRunning = false;
      if (this.patcherProcess) {
        this.patcherProcess.removeAllListeners();
        this.patcherProcess = null;
      }
    }
  }
  async ["getInstalledImportedSkins"]() {
    try {
      const _0x5c7b4d = [];
      try {
        const _0x5eec14 = await _0x5bff56.readdir(this.installedDir, {
          withFileTypes: true,
        });
        const _0x222b5f = _0x5eec14
          .filter((_0xed125b) => _0xed125b.isDirectory())
          .map((_0x17827d) => _0x17827d.name);
        _0x5c7b4d.push(..._0x222b5f);
      } catch (_0x1b72d4) {}
      try {
        const _0x504ff5 = await _0x5bff56.readdir(this.importedPath, {
          withFileTypes: true,
        });
        const _0x436010 = _0x504ff5
          .filter((_0x2bcf24) => _0x2bcf24.isDirectory())
          .map((_0x485ba7) => _0x485ba7.name)
          .filter((_0x3d57f1) => !_0x5c7b4d.includes(_0x3d57f1));
        _0x5c7b4d.push(..._0x436010);
      } catch (_0x41fd6c) {}
      return _0x5c7b4d;
    } catch (_0x4d92be) {
      return [];
    }
  }
  async ["installImportedSkins"](_0x15bb60) {
    await _0x5bff56
      .rm(this.installedDir, {
        recursive: true,
        force: true,
      })
      ["catch"](() => {});
    await _0x5bff56.mkdir(this.installedDir, {
      recursive: true,
    });
    await _0x5bff56.chmod(this.installedDir, 511);
    for (const _0x55b235 of _0x15bb60) {
      const _0x569770 = _0x2301fa.join(this.importedPath, _0x55b235);
      const _0x26d5a5 = _0x2301fa.join(this.installedDir, _0x55b235);
      try {
        await _0x5bff56.cp(_0x569770, _0x26d5a5, {
          recursive: true,
        });
        await _0x5bff56.chmod(_0x26d5a5, 511);
        const _0x5dca33 = await _0x5bff56.readdir(_0x26d5a5, {
          withFileTypes: true,
          recursive: true,
        });
        for (const _0x259e2c of _0x5dca33) {
          const _0xd23a51 = _0x2301fa.join(
            _0x26d5a5,
            _0x259e2c.path,
            _0x259e2c.name
          );
          await _0x5bff56.chmod(_0xd23a51, 511)["catch"](() => {});
        }
      } catch (_0x1c7b51) {
        console.error(
          "Error installing imported skin " + _0x55b235 + ":",
          _0x1c7b51
        );
        throw _0x1c7b51;
      }
    }
  }
  async ["cleanupProfiles"]() {
    try {
      await _0x5bff56
        .rm(this.profilesDir, {
          recursive: true,
          force: true,
        })
        ["catch"](() => {});
      await _0x5bff56.mkdir(this.profilesDir, {
        recursive: true,
      });
      await _0x5bff56.chmod(this.profilesDir, 511);
      const _0xdea8b9 = _0x2301fa.join(this.toolsPath, "current.profile");
      await _0x5bff56.unlink(_0xdea8b9)["catch"](() => {});
      console.log("Successfully cleaned up profiles directory");
    } catch (_0x11f954) {
      console.error("Error cleaning up profiles directory:", _0x11f954);
      throw _0x11f954;
    }
  }
  async ["prepareImportedSkins"](_0x1df2b2, _0x2e0b74) {
    try {
      this.sendThrottledStatus(
        "Preparing " + _0x1df2b2.length + " imported skins for overlay"
      );
      const _0x176030 = await this.getImportedSkins();
      const _0x4049d3 = _0x176030.filter((_0x595a8a) =>
        _0x1df2b2.includes(_0x595a8a.id)
      );
      if (_0x4049d3.length === 0) {
        this.sendThrottledStatus("No imported skins to prepare");
        return;
      }
      for (let _0x209382 = 0; _0x209382 < _0x4049d3.length; _0x209382 += 5) {
        const _0x39f37f = _0x4049d3.slice(_0x209382, _0x209382 + 5);
        await Promise.all(
          _0x39f37f.map(async (_0x380445) => {
            try {
              const _0x2d1587 = _0x380445.filePath;
              const _0x350127 = _0x2301fa.join(_0x2e0b74, _0x380445.id);
              await _0x5bff56.mkdir(_0x350127, {
                recursive: true,
              });
              await this.runTool([
                "import",
                _0x2301fa.resolve(_0x2d1587),
                _0x2301fa.resolve(_0x350127),
                "--game:" + (await this.getLeaguePath()),
                "--ignoreConflict",
              ]);
              this.sendThrottledStatus(
                "Prepared imported skin: " + _0x380445.name
              );
            } catch (_0x1352ec) {
              console.error(
                "Error preparing imported skin " + _0x380445.id + ":",
                _0x1352ec
              );
            }
          })
        );
      }
      this.sendThrottledStatus(
        "Finished preparing " + _0x4049d3.length + " imported skins"
      );
    } catch (_0xb84a0) {
      console.error("Error preparing imported skins:", _0xb84a0);
      throw _0xb84a0;
    }
  }
  ["setMainWindow"](_0xe6054f) {
    this.mainWindow = _0xe6054f;
  }
  async ["verifySkinExists"](_0x272373) {
    try {
      const _0x1b606c = _0x2301fa.join(this.importedPath, _0x272373);
      await _0x5bff56.access(_0x1b606c);
      return true;
    } catch (_0x58878b) {
      return false;
    }
  }
  async ["getChampionFromImportedSkin"](_0xdb6a1c) {
    try {
      console.log("Attempting to get champion name for skin " + _0xdb6a1c);
      const _0x178559 = _0x2301fa.join(this.importedPath, _0xdb6a1c);
      try {
        await _0x5bff56.access(_0x178559);
        console.log("Skin directory exists: " + _0x178559);
      } catch (_0x35d3bf) {
        console.error("Skin directory not found: " + _0x178559, _0x35d3bf);
        return null;
      }
      const _0x709232 = _0x2301fa.join(_0x178559, "WAD");
      try {
        await _0x5bff56.access(_0x709232);
        console.log("WAD directory exists: " + _0x709232);
        const _0xe87eab = await _0x5bff56.readdir(_0x709232);
        console.log("Files in WAD directory: " + _0xe87eab.join(", "));
        const _0x421bf9 = _0xe87eab.filter((_0x3ad5b6) =>
          _0x3ad5b6.toLowerCase().endsWith(".wad.client")
        );
        if (_0x421bf9.length > 0) {
          console.log(
            "Found " +
              _0x421bf9.length +
              " .wad.client files in WAD directory: " +
              _0x421bf9.join(", ")
          );
          for (const _0x7b4dc6 of _0x421bf9) {
            const _0x5e77a5 = _0x7b4dc6.split(".wad.client")[0];
            if (_0x5e77a5 && _0x5e77a5.length > 0) {
              console.log(
                "Found champion name for skin " + _0xdb6a1c + ": " + _0x5e77a5
              );
              return _0x5e77a5;
            }
          }
        } else {
          console.log("No .wad.client files found in WAD directory");
        }
      } catch (_0x3c4dd9) {
        console.log(
          "WAD directory not found or error accessing it: " +
            (_0x3c4dd9 instanceof Error ? _0x3c4dd9.message : String(_0x3c4dd9))
        );
      }
      console.log(
        "Searching recursively for .wad.client files in " + _0x178559
      );
      const _0x4e2f59 = async (_0x306457) => {
        const _0x321755 = [];
        try {
          const _0x54d3c6 = await _0x5bff56.readdir(_0x306457, {
            withFileTypes: true,
          });
          for (const _0x4e3c4a of _0x54d3c6) {
            const _0x265533 = _0x2301fa.join(_0x306457, _0x4e3c4a.name);
            if (_0x4e3c4a.isDirectory()) {
              const _0x5444af = await _0x4e2f59(_0x265533);
              _0x321755.push(..._0x5444af);
            } else if (
              _0x4e3c4a.isFile() &&
              _0x4e3c4a.name.toLowerCase().endsWith(".wad.client")
            ) {
              _0x321755.push(_0x265533);
            }
          }
        } catch (_0x3fc646) {
          console.error(
            "Error reading directory " + _0x306457 + ":",
            _0x3fc646
          );
        }
        return _0x321755;
      };
      const _0x43ace5 = await _0x4e2f59(_0x178559);
      if (_0x43ace5.length === 0) {
        console.log("No .wad.client files found for skin " + _0xdb6a1c);
        try {
          const _0x58f2f3 = _0x2301fa.join(_0x178559, "META", "info.json");
          const _0x199627 = JSON.parse(
            await _0x5bff56.readFile(_0x58f2f3, "utf-8")
          );
          if (_0x199627.Champion) {
            console.log(
              "Found champion name in META/info.json: " + _0x199627.Champion
            );
            return _0x199627.Champion;
          }
          if (_0x199627.Name) {
            const _0x5719d0 = [
              "Aatrox",
              "Ahri",
              "Akali",
              "Akshan",
              "Alistar",
              "Amumu",
              "Anivia",
              "Annie",
              "Aphelios",
              "Ashe",
              "Aurelion Sol",
              "Azir",
              "Bard",
              "Blitzcrank",
              "Brand",
              "Braum",
              "Caitlyn",
              "Camille",
              "Cassiopeia",
              "Cho'Gath",
              "Corki",
              "Darius",
              "Diana",
              "Dr. Mundo",
              "Draven",
              "Ekko",
              "Elise",
              "Evelynn",
              "Ezreal",
              "Fiddlesticks",
              "Fiora",
              "Fizz",
              "Galio",
              "Gangplank",
              "Garen",
              "Gnar",
              "Gragas",
              "Graves",
              "Gwen",
              "Hecarim",
              "Heimerdinger",
              "Illaoi",
              "Irelia",
              "Ivern",
              "Janna",
              "Jarvan IV",
              "Jax",
              "Jayce",
              "Jhin",
              "Jinx",
              "Kai'Sa",
              "Kalista",
              "Karma",
              "Karthus",
              "Kassadin",
              "Katarina",
              "Kayle",
              "Kayn",
              "Kennen",
              "Kha'Zix",
              "Kindred",
              "Kled",
              "Kog'Maw",
              "LeBlanc",
              "Lee Sin",
              "Leona",
              "Lillia",
              "Lissandra",
              "Lucian",
              "Lulu",
              "Lux",
              "Malphite",
              "Malzahar",
              "Maokai",
              "Master Yi",
              "Miss Fortune",
              "Mordekaiser",
              "Morgana",
              "Nami",
              "Nasus",
              "Nautilus",
              "Neeko",
              "Nidalee",
              "Nocturne",
              "Nunu",
              "Olaf",
              "Orianna",
              "Ornn",
              "Pantheon",
              "Poppy",
              "Pyke",
              "Qiyana",
              "Quinn",
              "Rakan",
              "Rammus",
              "Rek'Sai",
              "Rell",
              "Renekton",
              "Rengar",
              "Riven",
              "Rumble",
              "Ryze",
              "Samira",
              "Sejuani",
              "Senna",
              "Seraphine",
              "Sett",
              "Shaco",
              "Shen",
              "Shyvana",
              "Singed",
              "Sion",
              "Sivir",
              "Skarner",
              "Sona",
              "Soraka",
              "Swain",
              "Sylas",
              "Syndra",
              "Tahm Kench",
              "Taliyah",
              "Talon",
              "Taric",
              "Teemo",
              "Thresh",
              "Tristana",
              "Trundle",
              "Tryndamere",
              "Twisted Fate",
              "Twitch",
              "Udyr",
              "Urgot",
              "Varus",
              "Vayne",
              "Veigar",
              "Vel'Koz",
              "Vi",
              "Viego",
              "Viktor",
              "Vladimir",
              "Volibear",
              "Warwick",
              "Wukong",
              "Xayah",
              "Xerath",
              "Xin Zhao",
              "Yasuo",
              "Yone",
              "Yorick",
              "Yuumi",
              "Zac",
              "Zed",
              "Ziggs",
              "Zilean",
              "Zoe",
              "Zyra",
            ];
            for (const _0x5a173b of _0x5719d0) {
              if (_0x199627.Name.includes(_0x5a173b)) {
                console.log(
                  "Extracted champion name from skin name: " + _0x5a173b
                );
                return _0x5a173b;
              }
            }
          }
        } catch (_0x567c65) {
          console.log(
            "Error reading META/info.json: " +
              (_0x567c65 instanceof Error
                ? _0x567c65.message
                : String(_0x567c65))
          );
        }
        return null;
      }
      console.log("Found " + _0x43ace5.length + " .wad.client files:");
      for (const _0x1acac8 of _0x43ace5) {
        console.log("  - " + _0x1acac8);
      }
      for (const _0x3d726e of _0x43ace5) {
        const _0xdc5b6 = _0x2301fa.basename(_0x3d726e);
        console.log("Extracting champion name from file: " + _0xdc5b6);
        const _0x46921c = _0xdc5b6.split(".wad.client")[0];
        if (_0x46921c && _0x46921c.length > 0) {
          console.log(
            "Found champion name for skin " + _0xdb6a1c + ": " + _0x46921c
          );
          return _0x46921c;
        }
      }
      return null;
    } catch (_0x7a886d) {
      console.error(
        "Error getting champion for imported skin " + _0xdb6a1c + ":",
        _0x7a886d
      );
      return null;
    }
  }
  ["getImportedPath"]() {
    return this.importedPath;
  }
  ["getInstalledDir"]() {
    return this.installedDir;
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
  async ["backupImportedSkins"]() {
    try {
      if (this.isPatcherRunning) {
        throw new Error("Cannot backup skins while patcher is running");
      }
      this.sendThrottledStatus("Backing up imported skins...", true);
      await _0x5bff56.mkdir(this.backupPath, {
        recursive: true,
      });
      await _0x5bff56.chmod(this.backupPath, 511);
      const _0x319ce7 = await _0x5bff56.readdir(this.importedPath, {
        withFileTypes: true,
      });
      const _0x493fd9 = _0x319ce7.filter((_0x4d7b09) =>
        _0x4d7b09.isDirectory()
      );
      if (_0x493fd9.length === 0) {
        this.sendThrottledStatus("No skins to backup", true);
        return 0;
      }
      this.sendThrottledStatus(
        "Backing up " + _0x493fd9.length + " skins...",
        true
      );
      let _0x556901 = 0;
      for (let _0x4a5c9b = 0; _0x4a5c9b < _0x493fd9.length; _0x4a5c9b += 5) {
        const _0xef427d = _0x493fd9.slice(
          _0x4a5c9b,
          Math.min(_0x4a5c9b + 5, _0x493fd9.length)
        );
        await Promise.all(
          _0xef427d.map(async (_0x48490f) => {
            try {
              const _0x5d8309 = _0x2301fa.join(
                this.importedPath,
                _0x48490f.name
              );
              const _0x3b1e12 = _0x2301fa.join(this.backupPath, _0x48490f.name);
              try {
                const _0x101e38 = await _0x5bff56.stat(_0x5d8309);
                if (!_0x101e38.isDirectory()) {
                  return;
                }
                const _0x46075e = _0x2301fa.join(
                  _0x5d8309,
                  "META",
                  "info.json"
                );
                await _0x5bff56.access(_0x46075e);
                await _0x5bff56
                  .rm(_0x3b1e12, {
                    recursive: true,
                    force: true,
                  })
                  ["catch"](() => {});
                await _0x5bff56.cp(_0x5d8309, _0x3b1e12, {
                  recursive: true,
                });
                await _0x5bff56.chmod(_0x3b1e12, 511);
                _0x556901++;
                this.sendThrottledStatus(
                  "Backed up skin " + _0x48490f.name,
                  false
                );
              } catch (_0x35bdbb) {
                console.warn(
                  "Skipping invalid skin directory: " + _0x48490f.name
                );
              }
            } catch (_0x396f57) {
              console.error(
                "Error backing up skin " + _0x48490f.name + ":",
                _0x396f57
              );
            }
          })
        );
      }
      this.sendThrottledStatus(
        "Successfully backed up " + _0x556901 + " skins",
        true
      );
      return _0x556901;
    } catch (_0x1ab45a) {
      console.error("Error backing up imported skins:", _0x1ab45a);
      this.sendThrottledStatus(
        "Error backing up skins: " +
          (_0x1ab45a instanceof Error ? _0x1ab45a.message : "Unknown error"),
        true
      );
      throw _0x1ab45a;
    }
  }
  async ["restoreImportedSkins"]() {
    try {
      if (this.isPatcherRunning) {
        throw new Error("Cannot restore skins while patcher is running");
      }
      this.sendThrottledStatus(
        "Checking for backed up skins to restore...",
        true
      );
      try {
        await _0x5bff56.access(this.backupPath);
      } catch (_0x393821) {
        this.sendThrottledStatus("No backup directory found", true);
        return 0;
      }
      const _0x43dcf7 = await _0x5bff56.readdir(this.backupPath, {
        withFileTypes: true,
      });
      const _0x16e6ce = _0x43dcf7.filter((_0x419d1a) =>
        _0x419d1a.isDirectory()
      );
      if (_0x16e6ce.length === 0) {
        this.sendThrottledStatus("No backed up skins found to restore", true);
        return 0;
      }
      this.sendThrottledStatus(
        "Restoring " + _0x16e6ce.length + " skins...",
        true
      );
      await _0x5bff56.mkdir(this.importedPath, {
        recursive: true,
      });
      await _0x5bff56.chmod(this.importedPath, 511);
      let _0x55c3b4 = 0;
      for (let _0x90a6ab = 0; _0x90a6ab < _0x16e6ce.length; _0x90a6ab += 5) {
        const _0xc5c2b7 = _0x16e6ce.slice(
          _0x90a6ab,
          Math.min(_0x90a6ab + 5, _0x16e6ce.length)
        );
        await Promise.all(
          _0xc5c2b7.map(async (_0x918ec0) => {
            try {
              const _0x4805e8 = _0x2301fa.join(this.backupPath, _0x918ec0.name);
              const _0x53e1ce = _0x2301fa.join(
                this.importedPath,
                _0x918ec0.name
              );
              try {
                const _0x16e314 = _0x2301fa.join(
                  _0x4805e8,
                  "META",
                  "info.json"
                );
                await _0x5bff56.access(_0x16e314);
                await _0x5bff56
                  .rm(_0x53e1ce, {
                    recursive: true,
                    force: true,
                  })
                  ["catch"](() => {});
                await _0x5bff56.cp(_0x4805e8, _0x53e1ce, {
                  recursive: true,
                });
                await _0x5bff56.chmod(_0x53e1ce, 511);
                _0x55c3b4++;
                this.sendThrottledStatus(
                  "Restored skin " + _0x918ec0.name,
                  false
                );
              } catch (_0xa177d7) {
                console.warn("Skipping invalid backup: " + _0x918ec0.name);
              }
            } catch (_0x53708c) {
              console.error(
                "Error restoring skin " + _0x918ec0.name + ":",
                _0x53708c
              );
            }
          })
        );
      }
      this.sendThrottledStatus(
        "Successfully restored " + _0x55c3b4 + " skins",
        true
      );
      return _0x55c3b4;
    } catch (_0x22d449) {
      console.error("Error restoring imported skins:", _0x22d449);
      this.sendThrottledStatus(
        "Error restoring skins: " +
          (_0x22d449 instanceof Error ? _0x22d449.message : "Unknown error"),
        true
      );
      throw _0x22d449;
    }
  }
  ["getBackupPath"]() {
    return this.backupPath;
  }
}
export const importService = new ImportService();
