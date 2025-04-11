import _0x55b5a7 from "path";
import _0x141990 from "fs/promises";
import { spawn } from "child_process";
import { skinHelpers } from "../store.js";
export class InstalledService {
  constructor(_0x1c3d3e, _0x10e16f) {
    this.isPatcherRunning = false;
    this.lastStatusTime = 0;
    this.statusQueue = [];
    this.statusUpdateInterval = null;
    this.STATUS_THROTTLE_MS = 1000;
    this.importService = _0x1c3d3e;
    this.cslolService = _0x10e16f;
  }
  ["setMainWindow"](_0x2474de) {
    this.mainWindow = _0x2474de;
  }
  ["sendThrottledStatus"](_0x4d859e, _0x2d7b8c = false) {
    if (
      _0x2d7b8c ||
      _0x4d859e.includes("Error:") ||
      _0x4d859e.includes("Status: Starting patcher") ||
      _0x4d859e.includes("Status: Stopping patcher") ||
      _0x4d859e.includes("[DLL] info: Init done!") ||
      _0x4d859e.includes("[DLL] info: Exit in process!")
    ) {
      this.sendStatus(_0x4d859e);
      return;
    }
    if (this.mainWindow?.["isMinimized"]() && !_0x2d7b8c) {
      return;
    }
    const _0x44969a = Date.now();
    if (_0x4d859e.includes("[DLL]")) {
      if (!this.statusUpdateInterval) {
        this.statusUpdateInterval = setInterval(() => {
          if (this.statusQueue.length > 0) {
            this.sendStatus(this.statusQueue[this.statusQueue.length - 1]);
            this.statusQueue = [];
          } else if (Date.now() - this.lastStatusTime > 10000) {
            if (this.statusUpdateInterval) {
              clearInterval(this.statusUpdateInterval);
              this.statusUpdateInterval = null;
              this.statusQueue = [];
            }
          }
        }, this.STATUS_THROTTLE_MS);
      }
      this.statusQueue.push(_0x4d859e);
      this.lastStatusTime = _0x44969a;
    } else if (_0x44969a - this.lastStatusTime > 250) {
      this.sendStatus(_0x4d859e);
      this.lastStatusTime = _0x44969a;
    }
  }
  ["sendStatus"](_0x3d6556) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (!this.mainWindow.isMinimized()) {
        this.mainWindow.webContents.send("patcher-status", _0x3d6556);
      } else if (
        _0x3d6556.includes("Error:") ||
        _0x3d6556.includes("Status: Stopping") ||
        _0x3d6556.includes("[DLL] info: Init done!") ||
        _0x3d6556.includes("[DLL] info: Exit in process!")
      ) {
        this.mainWindow.webContents.send("patcher-status", _0x3d6556);
      }
    }
  }
  ["isPatcherActive"]() {
    return this.isPatcherRunning;
  }
  ["clearAllStatusIntervals"]() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
      this.statusQueue = [];
      console.log(
        "InstalledService: Cleared status update interval explicitly"
      );
    }
    this.lastStatusTime = 0;
  }
  async ["stopPatcher"]() {
    console.log("InstalledService: Starting patcher stop procedure");
    try {
      this.sendThrottledStatus("Status: Stopping patcher...", true);
      this.clearAllStatusIntervals();
      const _0x3ba34d = this.importService.isPatcherActive();
      const _0xcaab1b = this.cslolService.patcherProcess !== null;
      console.log(
        "InstalledService: Current patcher states - Import: " +
          _0x3ba34d +
          ", CSLOL: " +
          _0xcaab1b +
          ", this.isPatcherRunning: " +
          this.isPatcherRunning
      );
      console.log("InstalledService: First attempt to stop patchers");
      await Promise.all([
        this.importService.stopPatcher()["catch"]((_0x302215) => {
          console.error(
            "InstalledService: Error stopping import patcher (first attempt):",
            _0x302215
          );
        }),
        this.cslolService.stopPatcher()["catch"]((_0x5060e1) => {
          console.error(
            "InstalledService: Error stopping CSLOL patcher (first attempt):",
            _0x5060e1
          );
        }),
      ]);
      console.log(
        "InstalledService: Waiting for processes to terminate (first delay)"
      );
      await new Promise((_0xf0f1f9) => setTimeout(_0xf0f1f9, 1000));
      const _0x377ae4 = this.importService.isPatcherActive();
      const _0x50090e = this.cslolService.patcherProcess !== null;
      console.log(
        "InstalledService: Patcher states after first attempt - Import: " +
          _0x377ae4 +
          ", CSLOL: " +
          _0x50090e
      );
      if (_0x377ae4 || _0x50090e) {
        console.log(
          "InstalledService: Some patchers still running, making second attempt"
        );
        if (_0x377ae4) {
          console.log(
            "InstalledService: Second attempt to stop import patcher"
          );
          try {
            await this.importService.stopPatcher();
          } catch (_0x988700) {
            console.error(
              "InstalledService: Error stopping import patcher (second attempt):",
              _0x988700
            );
          }
        }
        if (_0x50090e) {
          console.log("InstalledService: Second attempt to stop CSLOL patcher");
          try {
            await this.cslolService.stopPatcher();
          } catch (_0x2b4048) {
            console.error(
              "InstalledService: Error stopping CSLOL patcher (second attempt):",
              _0x2b4048
            );
          }
        }
        console.log(
          "InstalledService: Waiting for processes to terminate (second delay)"
        );
        await new Promise((_0x3c5984) => setTimeout(_0x3c5984, 1000));
        try {
          console.log(
            "InstalledService: Using killOrphanedProcesses as last resort"
          );
          await this.cslolService.killOrphanedProcesses();
        } catch (_0x5a8b5f) {
          console.error(
            "InstalledService: Error killing orphaned processes:",
            _0x5a8b5f
          );
        }
      }
      const _0x13f96a = this.importService.isPatcherActive();
      const _0x25a5d4 = this.cslolService.patcherProcess !== null;
      console.log(
        "InstalledService: Final patcher states - Import: " +
          _0x13f96a +
          ", CSLOL: " +
          _0x25a5d4
      );
      try {
        console.log("InstalledService: Cleaning up profiles");
        await this.cleanupProfiles();
      } catch (_0x41b2e8) {
        console.error(
          "InstalledService: Error cleaning up profiles:",
          _0x41b2e8
        );
      }
      this.isPatcherRunning = false;
      console.log(
        "InstalledService: Reset internal patcher running state to false"
      );
      this.sendThrottledStatus("Status: Patcher stopped", true);
      console.log("InstalledService: Patcher stop procedure completed");
      return;
    } catch (_0x4a9934) {
      this.isPatcherRunning = false;
      console.error(
        "InstalledService: Critical error during patcher stop procedure:",
        _0x4a9934
      );
      this.sendThrottledStatus("Status: Patcher stopped (with errors)", true);
      throw _0x4a9934;
    }
  }
  async ["cleanupProfiles"]() {
    try {
      this.sendThrottledStatus("Status: Cleaning up profiles...", true);
      await Promise.all([
        this.importService.cleanupProfiles()["catch"]((_0x43a871) => {}),
        this.cslolService.cleanupProfiles()["catch"]((_0x3e59b1) => {}),
      ]);
      this.sendThrottledStatus("Status: Profiles cleaned up", true);
    } catch (_0x2d5d2f) {
      throw _0x2d5d2f;
    }
  }
  ["isAnyPatcherRunning"]() {
    const _0x3c2b91 = this.importService.isPatcherActive();
    const _0x263e6e = this.cslolService.patcherProcess !== null;
    const _0x58a811 = this.isPatcherRunning;
    console.log(
      "InstalledService.isAnyPatcherRunning check - Internal state: " +
        _0x58a811 +
        ", Import patcher: " +
        _0x3c2b91 +
        ", CSLOL patcher: " +
        _0x263e6e
    );
    if (_0x58a811 && !_0x3c2b91 && !_0x263e6e) {
      console.warn(
        "InstalledService: Internal state says running but no processes detected - potential state mismatch"
      );
    } else if (!_0x58a811 && (_0x3c2b91 || _0x263e6e)) {
      console.warn(
        "InstalledService: Processes detected but internal state says not running - potential state mismatch"
      );
    }
    const _0x400676 = _0x58a811 || _0x3c2b91 || _0x263e6e;
    console.log("InstalledService.isAnyPatcherRunning result: " + _0x400676);
    return _0x400676;
  }
  async ["createCombinedOverlay"](_0x107f94) {
    try {
      const _0x4dc857 = this.isAnyPatcherRunning();
      if (_0x4dc857) {
        try {
          await this.stopPatcher();
          const _0x317404 = this.isAnyPatcherRunning();
          if (_0x317404) {
            this.sendThrottledStatus(
              "Error: A patcher is already running. Please stop it first.",
              true
            );
            throw new Error("A patcher is already running");
          }
        } catch (_0x1479c1) {
          this.sendThrottledStatus(
            "Error: A patcher is already running. Please stop it first.",
            true
          );
          throw new Error("A patcher is already running");
        }
      }
      const _0x10c8bc =
        _0x107f94.imported.length +
        _0x107f94.paid.length +
        _0x107f94.free.length;
      if (_0x10c8bc === 0) {
        throw new Error("No active skins selected");
      }
      this.sendThrottledStatus(
        "Status: Creating overlay with " + _0x10c8bc + " active skins...",
        true
      );
      await this.cleanupProfiles();
      if (
        _0x107f94.imported.length > 0 &&
        _0x107f94.paid.length === 0 &&
        _0x107f94.free.length === 0
      ) {
        await this.importService.useImportedSkins(_0x107f94.imported);
        this.isPatcherRunning = true;
        this.sendThrottledStatus(
          "Status: Patcher started with imported skins",
          true
        );
        return;
      }
      if (
        _0x107f94.imported.length === 0 &&
        (_0x107f94.paid.length > 0 || _0x107f94.free.length > 0)
      ) {
        const _0x40d23a = [..._0x107f94.paid, ..._0x107f94.free];
        await this.cslolService.loadAndRunMods(_0x40d23a);
        this.isPatcherRunning = true;
        this.sendThrottledStatus(
          "Status: Patcher started with paid/free skins",
          true
        );
        return;
      }
      const _0x15949c = this.cslolService.getProfilesPath();
      const _0x4295e2 = this.cslolService.getTempPath();
      const _0x1a9a1b = _0x55b5a7.join(_0x4295e2, "combined");
      await _0x141990.mkdir(_0x1a9a1b, {
        recursive: true,
      });
      const _0x37ca69 = [..._0x107f94.paid, ..._0x107f94.free];
      let _0x57d01f = [];
      if (_0x37ca69.length > 0) {
        const _0x226926 = skinHelpers.getInstalledSkins("paid");
        const _0x47b67f = skinHelpers.getInstalledSkins("free");
        const _0x360bfe = [..._0x226926, ..._0x47b67f].map((_0x406ba4) =>
          _0x406ba4.toString()
        );
        const _0x1ef670 = _0x37ca69.filter((_0x1cda24) =>
          _0x360bfe.includes(_0x1cda24)
        );
        if (_0x1ef670.length === 0) {
        } else {
          _0x57d01f = _0x1ef670;
          for (
            let _0x4b5415 = 0;
            _0x4b5415 < _0x57d01f.length;
            _0x4b5415 += 3
          ) {
            const _0x3f7402 = _0x57d01f.slice(_0x4b5415, _0x4b5415 + 3);
            await Promise.all(
              _0x3f7402.map(async (_0xc52131) => {
                try {
                  const _0x23954f = _0x55b5a7.join(
                    this.cslolService.getCachePath(),
                    _0xc52131
                  );
                  const _0x32cb8f = _0x55b5a7.join(_0x1a9a1b, _0xc52131);
                  await this.cslolService.decryptDirectory(
                    _0x23954f,
                    _0x32cb8f
                  );
                } catch (_0x104fa2) {}
              })
            );
          }
        }
      }
      let _0x472343 = [];
      if (_0x107f94.imported.length > 0) {
        const _0x3aa131 = await this.importService.getInstalledImportedSkins();
        const _0x240952 = _0x107f94.imported.filter((_0x15f24e) =>
          _0x3aa131.includes(_0x15f24e)
        );
        if (_0x240952.length === 0) {
        } else {
          _0x472343 = _0x240952;
          for (const _0x4d77d5 of _0x240952) {
            try {
              const _0x4c9288 = this.importService.getInstalledDir();
              let _0x4ca0da = _0x55b5a7.join(_0x4c9288, _0x4d77d5);
              let _0x4f216d = false;
              try {
                await _0x141990.access(_0x4ca0da);
                _0x4f216d = true;
              } catch (_0x3fddfa) {
                const _0xd1f908 = this.importService.getImportedPath();
                _0x4ca0da = _0x55b5a7.join(_0xd1f908, _0x4d77d5);
                try {
                  await _0x141990.access(_0x4ca0da);
                  _0x4f216d = true;
                } catch (_0x87d516) {}
              }
              if (_0x4f216d) {
                const _0x258a40 = _0x55b5a7.join(_0x1a9a1b, _0x4d77d5);
                await this.copyDirectory(_0x4ca0da, _0x258a40);
              }
            } catch (_0xc4f9bb) {}
          }
        }
      }
      const _0xe7ccc6 = [..._0x57d01f, ..._0x472343];
      if (_0xe7ccc6.length === 0) {
        throw new Error(
          "No skins could be prepared. Please check that you have installed the selected skins."
        );
      }
      await _0x141990.writeFile(
        _0x55b5a7.join(_0x15949c, "current.profile"),
        "Default Profile\n"
      );
      const _0x374955 = _0xe7ccc6.join("\n") + "\n";
      await _0x141990.writeFile(
        _0x55b5a7.join(_0x15949c, "Default Profile.profile"),
        _0x374955
      );
      this.sendThrottledStatus("Status: Creating overlay...", true);
      const _0x3fb52e = _0x55b5a7.dirname(
        _0x55b5a7.join(_0x15949c, "Default Profile")
      );
      const _0x3e31dc = await this.checkDiskSpace(_0x3fb52e, 1000);
      if (!_0x3e31dc) {
        this.sendThrottledStatus(
          "Error: Not enough disk space on C: drive. Please free up some space and try again.",
          true
        );
        throw new Error(
          "Not enough disk space on C: drive. Please free up some space and try again."
        );
      }
      const _0x56ef46 = _0xe7ccc6.join("/");
      const _0x4a3370 = [
        "mkoverlay",
        _0x1a9a1b,
        _0x55b5a7.join(_0x15949c, "Default Profile"),
        "--game:" + _0x55b5a7.resolve(this.cslolService.getLeaguePath()),
        "--ignoreConflict",
        "--mods:" + _0x56ef46,
      ];
      try {
        await this.cslolService.runTool(_0x4a3370);
      } catch (_0x46f495) {
        const _0x104390 =
          _0x46f495 instanceof Error ? _0x46f495.message : String(_0x46f495);
        if (
          _0x104390.includes("space") ||
          _0x104390.includes("disk") ||
          _0x104390.includes("storage") ||
          _0x104390.includes("ENOSPC") ||
          _0x104390.includes("There is not enough space") ||
          _0x104390.includes("impl_reserve")
        ) {
          this.sendThrottledStatus(
            "Error: Not enough disk space on C: drive. Please free up some space and try again.",
            true
          );
          throw new Error(
            "Not enough disk space on C: drive. Please free up some space and try again."
          );
        }
        throw _0x46f495;
      }
      await _0x141990.rm(_0x1a9a1b, {
        recursive: true,
        force: true,
      });
      this.sendThrottledStatus("Status: Starting patcher...", true);
      const _0x2ab2d0 = spawn(
        _0x55b5a7.join(this.cslolService.getToolsPath(), "mod-tools.exe"),
        [
          "runoverlay",
          _0x55b5a7.join(_0x15949c, "Default Profile"),
          _0x55b5a7.join(_0x15949c, "Default Profile.config"),
          "--game:" + _0x55b5a7.resolve(this.cslolService.getLeaguePath()),
          "--opts:none",
        ],
        {
          cwd: this.cslolService.getToolsPath(),
          env: {
            ...process.env,
            PATH: this.cslolService.getToolsPath() + ";" + process.env.PATH,
            CSLOL_DISABLE_CLEANUP: "1",
          },
          stdio: ["pipe", "pipe", "pipe"],
        }
      );
      this.cslolService.patcherProcess = _0x2ab2d0;
      let _0x23d9a4 = "";
      let _0x519193 = false;
      if (_0x2ab2d0.stdout) {
        _0x2ab2d0.stdout.on("data", (_0x3c6f50) => {
          const _0x2eef79 = _0x3c6f50.toString();
          _0x23d9a4 += _0x2eef79;
          if (_0x23d9a4.includes("\n") || _0x23d9a4.length > 1024) {
            const _0x25735c = _0x23d9a4.split("\n");
            _0x23d9a4 = _0x25735c.pop() || "";
            for (const _0x2138a3 of _0x25735c) {
              const _0x39d6de = _0x2138a3.trim();
              if (!_0x39d6de) {
                continue;
              }
              if (_0x39d6de.includes("Error:")) {
                this.sendThrottledStatus(_0x39d6de, true);
              } else {
                if (_0x39d6de.includes("[DLL] info: Init done!")) {
                  _0x519193 = true;
                  this.sendThrottledStatus(_0x39d6de, true);
                  this.minimizeWindow();
                } else {
                  if (_0x39d6de.includes("[DLL] info: Exit in process!")) {
                    _0x519193 = false;
                    this.sendThrottledStatus(_0x39d6de, true);
                  } else {
                    if (
                      _0x39d6de.includes("League of Legends process detected")
                    ) {
                      this.sendThrottledStatus(
                        "Status: League client detected",
                        true
                      );
                    } else {
                      if (_0x39d6de.includes("Waiting for game")) {
                        this.sendThrottledStatus(
                          "Status: Waiting for match",
                          true
                        );
                      } else {
                        if (_0x519193 && _0x39d6de.includes("[DLL]")) {
                          this.sendThrottledStatus(_0x39d6de, false);
                        } else if (_0x39d6de.includes("Status:")) {
                          this.sendThrottledStatus(_0x39d6de, false);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
      }
      if (_0x2ab2d0.stderr) {
        _0x2ab2d0.stderr.on("data", (_0x32635f) => {
          const _0x311a61 = _0x32635f.toString().trim();
          this.sendThrottledStatus("Error: " + _0x311a61, true);
        });
      }
      _0x2ab2d0.on("error", (_0x347c2b) => {
        this.sendThrottledStatus("Error: " + _0x347c2b.message, true);
      });
      _0x2ab2d0.on("exit", (_0x4a76ef) => {
        this.cslolService.patcherProcess = null;
        if (_0x4a76ef !== 0) {
          this.sendThrottledStatus(
            "Error: Patcher exited with code " + _0x4a76ef,
            true
          );
        } else {
          this.sendThrottledStatus("Status: Patcher exited successfully", true);
        }
        if (this.statusUpdateInterval) {
          clearInterval(this.statusUpdateInterval);
          this.statusUpdateInterval = null;
        }
      });
      this.isPatcherRunning = true;
      this.sendThrottledStatus(
        "Status: Patcher started with combined skins",
        true
      );
    } catch (_0x1a01ef) {
      this.isPatcherRunning = false;
      if (_0x1a01ef instanceof Error) {
        this.sendThrottledStatus("Error: " + _0x1a01ef.message, true);
      } else {
        this.sendThrottledStatus("Error: An unknown error occurred", true);
      }
      throw _0x1a01ef;
    }
  }
  async ["copyDirectory"](_0x13d2c0, _0x27ea4a) {
    await _0x141990.mkdir(_0x27ea4a, {
      recursive: true,
    });
    const _0x4126cc = await _0x141990.readdir(_0x13d2c0, {
      withFileTypes: true,
    });
    for (const _0xc0c779 of _0x4126cc) {
      const _0x5974b2 = _0x55b5a7.join(_0x13d2c0, _0xc0c779.name);
      const _0xb2be7b = _0x55b5a7.join(_0x27ea4a, _0xc0c779.name);
      if (_0xc0c779.isDirectory()) {
        await this.copyDirectory(_0x5974b2, _0xb2be7b);
      } else {
        await _0x141990.copyFile(_0x5974b2, _0xb2be7b);
      }
    }
  }
  async ["checkDiskSpace"](_0x2358f3, _0x4137cd = 500) {
    try {
      let _0x16404d = "C:";
      const _0x5d232a = _0x2358f3.match(/^([a-zA-Z]:)/);
      if (_0x5d232a && _0x5d232a[1]) {
        _0x16404d = _0x5d232a[1];
      }
      const _0x50746f = _0x16404d + "\\";
      const { exec: _0x25aa54 } = require("child_process");
      return new Promise((_0xef2b0e) => {
        _0x25aa54("dir " + _0x50746f, (_0x411e66, _0x228593) => {
          if (_0x411e66) {
            console.error(
              "Error checking disk space on " + _0x50746f + ":",
              _0x411e66
            );
            _0xef2b0e(true);
            return;
          }
          const _0xfe0a5b = _0x228593.match(/(\d+(?:,\d+)*) bytes free/i);
          if (_0xfe0a5b && _0xfe0a5b[1]) {
            const _0xc6fa93 = parseInt(_0xfe0a5b[1].replace(/,/g, ""), 10);
            const _0x511c92 = _0xc6fa93 / 1048576;
            console.log(
              "Available space on " +
                _0x16404d +
                ": " +
                _0x511c92.toFixed(2) +
                " MB (need " +
                _0x4137cd +
                " MB)"
            );
            _0xef2b0e(_0x511c92 >= _0x4137cd);
          } else {
            console.error(
              "Failed to parse disk space output for " + _0x50746f + ":",
              _0x228593
            );
            _0xef2b0e(true);
          }
        });
      });
    } catch (_0x2e0a7e) {
      console.error("Error checking disk space:", _0x2e0a7e);
      return true;
    }
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
