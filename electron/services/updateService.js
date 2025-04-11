import { app, BrowserWindow } from "electron";
import _0x25e30d from "electron-log";
import { autoUpdater } from "electron-updater";
import { importService } from "./importService.js";
import _0x381285 from "path";
import _0x2b98ec from "fs/promises";
export class UpdateService {
  static async ["initialize"](_0x4dd0e6) {
    const _0x122d6a = new UpdateService();
    if (_0x4dd0e6) {
      _0x122d6a.setWindow(_0x4dd0e6);
      if (!_0x122d6a.initialized) {
        _0x122d6a.setupAutoUpdater()["catch"]((_0x1d933d) => {
          _0x122d6a.logger.error("Auto updater setup failed:", _0x1d933d);
        });
        return _0x122d6a;
      }
    }
    return _0x122d6a;
  }
  constructor() {
    this.checkInProgress = false;
    this.updateDownloaded = false;
    this.initialized = false;
    this.skinsBackedUp = false;
    this.logger = _0x25e30d;
    this.checkInProgress = false;
    this.updateDownloaded = false;
    this.skinsBackedUp = false;
  }
  ["setWindow"](_0x1bcf6a) {
    this.window = _0x1bcf6a;
    if (this.initialized) {
      this.setupEventHandlers();
    }
  }
  ["setupEventHandlers"]() {
    if (!this.window) {
      return;
    }
    autoUpdater.removeAllListeners();
    autoUpdater.on("error", (_0x2a822c) => {
      this.checkInProgress = false;
      this.logger.error("Update error:", _0x2a822c);
      const _0x189859 = this.getUpdateErrorMessage(_0x2a822c);
      this.window?.["webContents"]["send"]("update-error", _0x189859);
    });
    autoUpdater.on("update-available", (_0x5542b8) => {
      this.logger.info("Update available:", _0x5542b8);
      this.window?.["webContents"]["send"]("update-available", _0x5542b8);
      this.window?.["webContents"]["send"](
        "update-status",
        "Downloading update automatically..."
      );
      this.downloadUpdate()["catch"]((_0x3e76b5) => {
        this.logger.error("Auto download failed:", _0x3e76b5);
      });
    });
    autoUpdater.on("update-not-available", () => {
      this.checkInProgress = false;
      this.logger.info("No updates available");
      this.window?.["webContents"]["send"]("update-not-available");
    });
    autoUpdater.on("download-progress", (_0x2adf95) => {
      const _0x3466f4 = Math.round(_0x2adf95.percent);
      const _0x5e9c37 = this.formatBytes(_0x2adf95.bytesPerSecond);
      const _0x45a71a = this.formatBytes(_0x2adf95.transferred);
      const _0xe213c7 = this.formatBytes(_0x2adf95.total);
      const _0xcfc98e =
        "Downloading: " +
        _0x3466f4 +
        "% (" +
        _0x45a71a +
        "/" +
        _0xe213c7 +
        " @ " +
        _0x5e9c37 +
        "/s)";
      this.window?.["webContents"]["send"]("update-status", _0xcfc98e);
    });
    autoUpdater.on("update-downloaded", async () => {
      this.updateDownloaded = true;
      try {
        await this.backupSkinsBeforeUpdate();
        this.window?.["webContents"]["send"]("update-downloaded");
        this.window?.["webContents"]["send"](
          "update-status",
          "Update ready. Please restart the application to install."
        );
      } catch (_0x1cf840) {
        this.logger.error("Error during skin backup before update:", _0x1cf840);
        this.window?.["webContents"]["send"]("update-downloaded");
        this.window?.["webContents"]["send"](
          "update-status",
          "Update ready, but skin backup failed. Please restart the application to install."
        );
      }
    });
    this.checkForPostUpdateRestore();
  }
  async ["backupSkinsBeforeUpdate"]() {
    try {
      this.logger.info("Backing up imported skins before update...");
      this.window?.["webContents"]["send"](
        "update-status",
        "Backing up skins before update..."
      );
      const _0x11646d = await importService.backupImportedSkins();
      if (_0x11646d > 0) {
        this.logger.info(
          "Successfully backed up " + _0x11646d + " skins before update"
        );
        this.window?.["webContents"]["send"](
          "update-status",
          "Backed up " + _0x11646d + " skins. Update ready."
        );
        await this.setRestoreSkinsFlag();
        this.skinsBackedUp = true;
      } else {
        this.logger.info("No skins to backup before update");
      }
    } catch (_0x2c63eb) {
      this.logger.error("Failed to backup skins before update:", _0x2c63eb);
      throw _0x2c63eb;
    }
  }
  async ["setRestoreSkinsFlag"]() {
    try {
      const _0x1aad33 = _0x381285.join(
        app.getPath("userData"),
        "restore-skins-after-update"
      );
      await _0x2b98ec.writeFile(_0x1aad33, Date.now().toString());
      this.logger.info("Set restore skins flag for post-update restoration");
    } catch (_0x19feb0) {
      this.logger.error("Failed to set restore skins flag:", _0x19feb0);
    }
  }
  async ["checkForPostUpdateRestore"]() {
    try {
      const _0x2e2d63 = _0x381285.join(
        app.getPath("userData"),
        "restore-skins-after-update"
      );
      try {
        await _0x2b98ec.access(_0x2e2d63);
      } catch (_0x3723d5) {
        return;
      }
      this.logger.info("Detected post-update skin restoration flag");
      this.window?.["webContents"]["send"](
        "update-status",
        "Restoring skins after update..."
      );
      const _0x356079 = await importService.restoreImportedSkins();
      if (_0x356079 > 0) {
        this.logger.info(
          "Successfully restored " + _0x356079 + " skins after update"
        );
        this.window?.["webContents"]["send"](
          "update-status",
          "Restored " + _0x356079 + " skins after update"
        );
        try {
          const _0x17db8b = importService.getBackupPath();
          this.logger.info("Cleaning up backup directory: " + _0x17db8b);
          await _0x2b98ec.rm(_0x17db8b, {
            recursive: true,
            force: true,
          });
          this.logger.info(
            "Successfully deleted backup directory after restoration"
          );
        } catch (_0x539262) {
          this.logger.warn("Failed to clean up backup directory:", _0x539262);
        }
      } else {
        this.logger.info("No skins needed to be restored after update");
      }
      await _0x2b98ec.unlink(_0x2e2d63);
    } catch (_0x320fe2) {
      this.logger.error("Error restoring skins after update:", _0x320fe2);
      try {
        const _0x1ccb85 = _0x381285.join(
          app.getPath("userData"),
          "restore-skins-after-update"
        );
        await _0x2b98ec.unlink(_0x1ccb85)["catch"](() => {});
      } catch (_0x150d24) {}
    }
  }
  ["getUpdateErrorMessage"](_0x50b447) {
    if (_0x50b447.message.includes("Cannot parse blockmap")) {
      return "Update download started. This may take a few minutes...";
    }
    if (_0x50b447.message.includes("net::ERR_CONNECTION_TIMED_OUT")) {
      return "Update check timed out. Please check your internet connection.";
    }
    return "An error occurred while checking for updates. Please try again later.";
  }
  ["formatBytes"](_0x401095) {
    if (_0x401095 === 0) {
      return "0 B";
    }
    const _0x4a20c8 = ["B", "KB", "MB", "GB"];
    const _0x2c745c = Math.floor(Math.log(_0x401095) / Math.log(1024));
    return (
      parseFloat((_0x401095 / Math.pow(1024, _0x2c745c)).toFixed(2)) +
      " " +
      _0x4a20c8[_0x2c745c]
    );
  }
  async ["setupAutoUpdater"]() {
    if (this.initialized) {
      return;
    }
    try {
      this.logger.transports.file.level = "info";
      autoUpdater.logger = this.logger;
      autoUpdater.autoDownload = true;
      autoUpdater.allowDowngrade = false;
      autoUpdater.allowPrerelease = false;
      autoUpdater.disableWebInstaller = true;
      autoUpdater.requestHeaders = {
        timeout: 0xea60,
      };
      autoUpdater.setFeedURL({
        provider: "github",
        owner: "sxrmss",
        repo: "celestial-releases",
        private: false,
        releaseType: "release",
      });
      if (this.window) {
        this.setupEventHandlers();
      }
      this.initialized = true;
      this.logger.info("Auto updater setup completed");
      this.logger.info(
        "Performing initial update check at application startup"
      );
      this.checkForUpdates()["catch"]((_0x24efd3) => {
        this.logger.error("Initial update check failed:", _0x24efd3);
      });
    } catch (_0x49cd99) {
      this.logger.error("Failed to setup auto updater:", _0x49cd99);
      this.initialized = false;
      throw _0x49cd99;
    }
  }
  async ["checkForUpdates"]() {
    if (!this.window || this.checkInProgress || !this.initialized) {
      this.logger.info("Update check skipped:", {
        noWindow: !this.window,
        checkInProgress: this.checkInProgress,
        notInitialized: !this.initialized,
      });
      return;
    }
    try {
      this.checkInProgress = true;
      this.logger.info("Checking for updates in background...");
      const _0x4615ba = new Promise((_0x1d5945, _0x58e345) => {
        setTimeout(() => _0x58e345(new Error("Update check timed out")), 60000);
      });
      await Promise.race([autoUpdater.checkForUpdates(), _0x4615ba]);
    } catch (_0x29e84c) {
      this.checkInProgress = false;
      this.logger.error("Update check failed:", _0x29e84c);
      this.window?.["webContents"]["send"]("update-error", _0x29e84c.message);
    } finally {
      this.checkInProgress = false;
    }
  }
  async ["downloadUpdate"]() {
    if (!this.window || this.updateDownloaded) {
      return;
    }
    try {
      this.window.webContents.send("update-status", "Starting download...");
      await autoUpdater.downloadUpdate();
    } catch (_0x49df75) {
      this.logger.error("Download failed:", _0x49df75);
      const _0x17c92f = this.getUpdateErrorMessage(_0x49df75);
      this.window?.["webContents"]["send"]("update-error", _0x17c92f);
    }
  }
  async ["quitAndInstall"]() {
    if (this.updateDownloaded) {
      this.logger.info("Preparing to quit and install update...");
      if (!this.skinsBackedUp) {
        try {
          this.logger.info("Performing final skin backup before quitting...");
          await importService.backupImportedSkins();
          await this.setRestoreSkinsFlag();
        } catch (_0x26c5f4) {
          this.logger.error("Final skin backup before quit failed:", _0x26c5f4);
        }
      }
      BrowserWindow.getAllWindows().forEach((_0xbadd5a) => {
        if (!_0xbadd5a.isDestroyed()) {
          _0xbadd5a.close();
        }
      });
      setTimeout(() => {
        this.logger.info("Forcing application quit before installing update");
        app.exit(0);
      }, 1000);
      autoUpdater.quitAndInstall(true, true);
    } else {
      this.logger.warn(
        "Attempted to quit and install, but no update has been downloaded"
      );
    }
  }
  ["isUpdateReady"]() {
    return this.updateDownloaded;
  }
}
