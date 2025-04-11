import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import _0x4fb86a from "node:path";
import _0x327c15 from "node:fs";
import _0x338588 from "electron-log";
import { fileURLToPath } from "node:url";
import { leaguePathService } from "./services/leaguePathService.js";
import { authService } from "./services/authService.js";
import { customService } from "./services/customService.js";
import { skinService } from "./services/skinService.js";
import { cslolService } from "./services/cslolService.js";
import { importService } from "./services/importService.js";
import { securityService } from "./services/securityService.js";
import { initializeStore } from "./store.js";
import { UpdateService } from "./services/updateService.cjs";
import { loggerService } from "./services/loggerService.js";
import { InstalledService } from "./services/installedService.js";
import { SECRETS } from "./config/secrets.js";
import { assetService } from "./services/assetService.js";
import { skinHelpers } from "./store.js";
import { store } from "./store.js";
import { promises as _0x4d42b5 } from "fs";
app.setName("Celestial Launcher");
if (process.platform === "win32") {
  app.setAppUserModelId("com.electron.divine-manager");
}
process.on("uncaughtException", (_0x4e8000) => {
  const _0x74ae1d =
    "Uncaught exception: " + _0x4e8000 + "\nStack: " + _0x4e8000.stack;
  console.error(_0x74ae1d);
  _0x327c15.appendFileSync(
    _0x4fb86a.join(app.getPath("userData"), "crash.log"),
    _0x74ae1d + "\n"
  );
  dialog.showErrorBox(
    "Fatal Error",
    "The application has crashed. Please check the crash log at:\n" +
      _0x4fb86a.join(app.getPath("userData"), "crash.log")
  );
  app.exit(1);
});
process.on("unhandledRejection", (_0x8e21e8) => {
  const _0x155f25 =
    "Unhandled rejection: " +
    (_0x8e21e8 instanceof Error ? _0x8e21e8.message : _0x8e21e8) +
    "\nStack: " +
    (_0x8e21e8 instanceof Error ? _0x8e21e8.stack : "No stack trace");
  console.error(_0x155f25);
  _0x327c15.appendFileSync(
    _0x4fb86a.join(app.getPath("userData"), "crash.log"),
    _0x155f25 + "\n"
  );
});
process.on("SIGTERM", async () => {
  try {
    _0x338588.info("Received SIGTERM signal, cleaning up...");
    await importService.cleanupProfiles();
    await cslolService.cleanup();
    securityService.cleanSensitiveData();
    _0x338588.info("Cleanup completed, exiting...");
    app.exit(0);
  } catch (_0xa9c704) {
    _0x338588.error("Error during termination cleanup:", _0xa9c704);
    app.exit(1);
  }
});
process.on("SIGINT", async () => {
  try {
    _0x338588.info("Received SIGINT signal, cleaning up...");
    await cleanupAllServices();
    _0x338588.info("Cleanup completed, exiting...");
    app.exit(0);
  } catch (_0x2e2cd1) {
    _0x338588.error("Error during SIGINT cleanup:", _0x2e2cd1);
    app.exit(1);
  }
});
const userDataPath = app.getPath("userData");
const logPath = _0x4fb86a.join(userDataPath, "logs");
console.log("User Data Path:", userDataPath);
console.log("Log Path:", logPath);
try {
  if (!_0x327c15.existsSync(logPath)) {
    _0x327c15.mkdirSync(logPath, {
      recursive: true,
    });
  }
  _0x338588.transports.file.resolvePathFn = () =>
    _0x4fb86a.join(logPath, "main.log");
  _0x338588.transports.file.level = "debug";
  _0x338588.transports.console.level = "debug";
  _0x338588.catchErrors({
    showDialog: false,
    onError: (_0x127f8d) => {
      console.error("Caught error:", _0x127f8d);
    },
  });
  _0x338588.info("Logging initialized");
  _0x338588.info("Log path:", logPath);
} catch (_0x43fdb2) {
  console.error("Failed to initialize logging:", _0x43fdb2);
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = _0x4fb86a.dirname(__filename);
const isDev =
  process.env.NODE_ENV === "development" ||
  process.defaultApp ||
  /electron/.test(process.argv[0]) ||
  !!process.env.ELECTRON_IS_DEV;
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  defaultApp: process.defaultApp,
  argv0: process.argv[0],
  isDev: isDev,
});
let mainWindow = null;
let updateService = null;
let windowCreated = false;
let handlersRegistered = false;
let installedService;
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_0x5767b7, _0x270107, _0x521de5) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
if (isDev) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("divine-manager", process.execPath, [
        _0x4fb86a.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient("divine-manager");
  }
}
securityService;
async function validateSecrets() {
  if (!SECRETS.ENCRYPTION_KEY) {
    _0x338588.error("Missing required encryption key");
    throw new Error("Missing required encryption key");
  }
}
function logSystemInfo() {
  _0x338588.info("System Information:");
  _0x338588.info("Platform:", process.platform);
  _0x338588.info("Architecture:", process.arch);
  _0x338588.info("Node Version:", process.version);
  _0x338588.info("Electron Version:", process.versions.electron);
  _0x338588.info("Chrome Version:", process.versions.chrome);
  _0x338588.info("App Path:", app.getAppPath());
  _0x338588.info("User Data Path:", app.getPath("userData"));
}
async function initializeApp() {
  try {
    const _0x2309ec = new BrowserWindow({
      width: 0x190,
      height: 0xc8,
      frame: false,
      transparent: true,
      backgroundColor: "#1a1525",
      webPreferences: {
        nodeIntegration: true,
      },
    });
    await initializeStore();
    _0x338588.info("Using parallel installation for skins");
    createWindow();
    _0x338588.info(
      "Auto-updater will check for updates at application startup"
    );
    setTimeout(() => {
      if (importService && cslolService && mainWindow) {
        installedService = new InstalledService(importService, cslolService);
        installedService.setMainWindow(mainWindow);
        _0x338588.info("OverlayService initialized successfully");
      } else {
        _0x338588.error(
          "Could not initialize OverlayService: required services or mainWindow not available"
        );
        const _0x4b5e99 = [];
        if (!importService) {
          _0x4b5e99.push("importService");
        }
        if (!cslolService) {
          _0x4b5e99.push("cslolService");
        }
        if (!mainWindow) {
          _0x4b5e99.push("mainWindow");
        }
        _0x338588.error("Missing dependencies: " + _0x4b5e99.join(", "));
      }
    }, 1000);
    const _0x472902 = Promise.all([validateSecrets()])["catch"]((_0x3ef4e5) => {
      _0x338588.error("Non-critical init error:", _0x3ef4e5);
      dialog.showErrorBox(
        "Initialization Error",
        "Failed to validate application secrets. The application may not function correctly."
      );
    });
    if (mainWindow) {
      mainWindow.once("ready-to-show", () => {
        mainWindow?.["show"]();
        _0x2309ec.close();
      });
    }
    await _0x472902;
  } catch (_0x119310) {
    _0x338588.error("Failed to initialize app:", _0x119310);
    dialog.showErrorBox(
      "Fatal Error",
      "Failed to initialize application. Please check the logs."
    );
    app.exit(1);
  }
}
const WINDOW_CONFIG = {
  width: 0x4b0,
  height: 0x320,
  resizable: false,
  maximizable: false,
  backgroundColor: "#1a1525",
  show: false,
  frame: true,
  autoHideMenuBar: true,
  title: "Celestial Launcher",
  icon: isDev
    ? _0x4fb86a.join(process.cwd(), "resources", "public", "celestial-logo.ico")
    : _0x4fb86a.join(process.resourcesPath, "public", "celestial-logo.ico"),
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    sandbox: false,
    backgroundThrottling: false,
    enableWebSQL: false,
    spellcheck: false,
  },
};
async function createWindow() {
  if (windowCreated || mainWindow) {
    _0x338588.info("Window already exists, skipping creation");
    return;
  }
  const _0x582a1f = performance.now();
  _0x338588.info("Creating main window...");
  try {
    mainWindow = new BrowserWindow({
      ...WINDOW_CONFIG,
      webPreferences: {
        ...WINDOW_CONFIG.webPreferences,
        preload: _0x4fb86a.join(__dirname, "./preload.cjs"),
      },
    });
    setupWindowEvents(mainWindow);
    await loadWindowContent(mainWindow);
    if (cslolService) {
      cslolService.setMainWindow(mainWindow);
    }
    if (importService) {
      importService.setMainWindow(mainWindow);
    }
    if (installedService) {
      installedService.setMainWindow(mainWindow);
      _0x338588.info("Updated existing OverlayService with new mainWindow");
    } else if (importService && cslolService) {
      installedService = new InstalledService(importService, cslolService);
      installedService.setMainWindow(mainWindow);
      _0x338588.info("OverlayService initialized during window creation");
    }
    windowCreated = true;
    const _0x1df8c7 = performance.now() - _0x582a1f;
    _0x338588.info(
      "Window creation completed in " + _0x1df8c7.toFixed(2) + "ms"
    );
  } catch (_0xffed3a) {
    _0x338588.error("Error creating window:", _0xffed3a);
    throw _0xffed3a;
  }
}
function setupWindowEvents(_0x15579d) {
  _0x15579d.once("ready-to-show", () => {
    _0x338588.info("Window ready to show");
    _0x15579d.show();
    if (!updateService) {
      initializeUpdateService(_0x15579d);
    }
  });
  _0x15579d.webContents.once("did-finish-load", () => {
    _0x338588.info("Window finished loading");
  });
}
async function loadWindowContent(_0x4712f3) {
  if (isDev) {
    _0x338588.info("Loading development server...");
    await _0x4712f3.loadURL("http://localhost:5173")["catch"]((_0x29b485) => {
      _0x338588.error("Failed to load dev server:", _0x29b485);
      throw _0x29b485;
    });
  } else {
    const _0x41f2ed = _0x4fb86a.join(app.getAppPath(), "dist", "index.html");
    _0x338588.info("Loading production file:", _0x41f2ed);
    try {
      await _0x4712f3.loadFile(_0x41f2ed);
    } catch (_0x5b6e36) {
      _0x338588.error("Failed to load production file:", _0x5b6e36);
      const _0x18fc56 = _0x4fb86a.join(process.cwd(), "dist", "index.html");
      _0x338588.info("Trying fallback path:", _0x18fc56);
      await _0x4712f3.loadFile(_0x18fc56);
    }
  }
}
async function initializeUpdateService(_0x25879e) {
  if (!updateService) {
    _0x338588.info("Initializing update service...");
    try {
      updateService = await UpdateService.initialize(_0x25879e);
      _0x338588.info("Checking for updates at application startup");
    } catch (_0xd7b9dd) {
      _0x338588.error("Failed to initialize update service:", _0xd7b9dd);
    }
  } else {
    updateService.setWindow(_0x25879e);
  }
}
const ipcHandlerRegistry = new Map([
  ["select-league-path", () => leaguePathService.selectLeaguePath()],
  ["get-league-path", () => leaguePathService.getLeaguePath()],
  [
    "verify-league-path",
    (_0x56f3a6, _0x3d9292) => leaguePathService.verifyLeaguePath(_0x3d9292),
  ],
  [
    "set-league-path",
    (_0x1990cb, _0x236814) => leaguePathService.setLeaguePath(_0x236814),
  ],
  ["login", (_0x3583f7, _0x10af99) => authService.login(_0x10af99)],
  ["logout", () => authService.logout()],
  ["is-authenticated", () => authService.isAuthenticated()],
  ["get-auth-data", () => authService.getAuthData()],
  ["get-paid-user-skins", () => customService.getPaidUserSkins()],
  ["get-free-skins", () => customService.getFreeSkins()],
  [
    "hard-refresh",
    () => {
      try {
        const _0x33f483 = store.get("auth");
        store.clear();
        store.set("auth", _0x33f483);
        store.set("settings", {
          leaguePath: "",
          lastUpdated: null,
        });
        store.set("paths", {
          cache: null,
        });
        store.set("activeSkins", {
          imported: {},
          paid: {},
          free: {},
        });
        store.set("installedSkins", {
          paid: [],
          free: [],
        });
        return {
          success: true,
          message: "Store data reset successfully",
        };
      } catch (_0x696228) {
        _0x338588.error("Error resetting store data:", _0x696228);
        return {
          success: false,
          message: "Failed to reset store data",
        };
      }
    },
  ],
  [
    "fetch-fantome-files",
    (_0x2bf55e, _0x5e8697) => skinService.fetchFantomeFiles(_0x5e8697),
  ],
  [
    "install-fantome-files",
    (_0x1a04e4, _0x361c6a) => cslolService.installFantomeFile(_0x361c6a),
  ],
  [
    "load-and-run-mods",
    (_0x35b662, _0x59493d) => cslolService.loadAndRunMods(_0x59493d),
  ],
  [
    "import-fantome-files",
    async (_0x1eb7d1, _0x5e9895) => {
      try {
        _0x338588.info("Importing " + _0x5e9895.length + " fantome files");
        try {
          return await importService.importFantomeFiles(_0x5e9895);
        } catch (_0x39c1e1) {
          const _0x4a5cfb = _0x39c1e1?.["message"] || "";
          if (
            _0x4a5cfb.includes("disk space") ||
            _0x4a5cfb.includes("space on the disk") ||
            _0x4a5cfb.includes("There is not enough space") ||
            _0x4a5cfb.includes("ENOSPC") ||
            _0x4a5cfb.includes("impl_reserve")
          ) {
            _0x338588.error(
              "Not enough disk space while importing fantome files"
            );
            throw new Error(
              "Not enough disk space on C: drive. Please free up some space and try again."
            );
          }
          throw _0x39c1e1;
        }
      } catch (_0x4cef23) {
        _0x338588.error("Error importing fantome files:", _0x4cef23);
        throw _0x4cef23;
      }
    },
  ],
  ["get-imported-skins", () => importService.getImportedSkins()],
  [
    "get-champion-from-imported-skin",
    (_0x49e488, _0x4656c0) =>
      importService.getChampionFromImportedSkin(_0x4656c0),
  ],
  [
    "remove-imported-skin",
    (_0x19cd0b, _0x427155) => importService.removeImportedSkin(_0x427155),
  ],
  [
    "use-imported-skins",
    (_0x3cacf9, _0x587952) => importService.useImportedSkins(_0x587952),
  ],
  [
    "stop-patcher",
    async (_0x2df93a) => {
      try {
        _0x338588.info("Stopping patcher via IPC call");
        if (installedService) {
          _0x338588.info("Using installedService to stop patcher");
          await installedService.stopPatcher();
        } else {
          _0x338588.warn(
            "installedService not available, falling back to legacy method"
          );
          if (importService.patcherProcess) {
            await importService.stopPatcher();
          }
          if (cslolService.patcherProcess) {
            await cslolService.stopPatcher();
          }
          try {
            await cslolService.killOrphanedProcesses();
          } catch (_0x155ece) {
            _0x338588.error("Error killing orphaned processes:", _0x155ece);
          }
        }
        _0x338588.info("Patcher stopping completed successfully");
        return {
          success: true,
        };
      } catch (_0x2fdeff) {
        _0x338588.error("Error stopping patcher:", _0x2fdeff);
        try {
          if (cslolService) {
            await cslolService.killOrphanedProcesses();
          }
        } catch (_0x1fbca7) {
          _0x338588.error("Error during emergency cleanup:", _0x1fbca7);
        }
        throw _0x2fdeff;
      }
    },
  ],
  ["get-installed-skins", () => cslolService.getInstalledSkins()],
  ["get-installed-path", () => cslolService.getInstalledPath()],
  ["get-cache-path", () => cslolService.getCachePath()],
  ["get-temp-path", () => cslolService.getTempPath()],
  ["get-profiles-path", () => cslolService.getProfilesPath()],
  ["get-logs", () => loggerService.getLogs()],
  ["clear-logs", () => loggerService.clearLogs()],
  ["open-external", (_0x2b27e0, _0x2b6049) => shell.openExternal(_0x2b6049)],
  [
    "save-active-skins",
    async (_0x3fa974, _0x34ab28, _0x444d00) => {
      try {
        const _0x102c73 = skinHelpers.getActiveSkins(_0x34ab28);
        skinHelpers.saveActiveSkins(_0x34ab28, _0x444d00);
        const _0x5d8cea = Object.entries(_0x102c73)
          .filter(([_0x1ce5ca, _0x1ba2de]) => _0x1ba2de)
          .map(([_0x3f5d62]) => _0x3f5d62);
        const _0x2723e1 = Object.entries(_0x444d00)
          .filter(([_0x2bc4df, _0x5eb9c3]) => _0x5eb9c3)
          .map(([_0x57d388]) => _0x57d388);
        const _0x1131b5 = _0x5d8cea.filter(
          (_0x1cc5c2) => !_0x2723e1.includes(_0x1cc5c2)
        );
        if (_0x1131b5.length > 0) {
          _0x338588.info(
            "Cleaning up profiles for deactivated " + _0x34ab28 + " skins:",
            _0x1131b5
          );
          if (_0x34ab28 === "imported") {
            await importService.cleanupProfiles();
          } else {
            await cslolService.cleanupProfiles();
          }
        }
        return {
          success: true,
        };
      } catch (_0x17ac80) {
        _0x338588.error(
          "Error saving active " + _0x34ab28 + " skins:",
          _0x17ac80
        );
        throw _0x17ac80;
      }
    },
  ],
  [
    "get-active-skins",
    (_0x474ea4, _0x5b32fc) => {
      return skinHelpers.getActiveSkins(_0x5b32fc);
    },
  ],
  ["repair-installed-skins", () => cslolService.repairInstalledSkins()],
  ["cleanup-profiles", () => importService.cleanupProfiles()],
  ["cleanup-cslol-profiles", () => cslolService.cleanupProfiles()],
  [
    "get-installed-skins",
    async (_0x4dea23, _0x158507) => {
      try {
        if (_0x158507) {
          return skinHelpers.getInstalledSkins(_0x158507);
        } else {
          const _0x27add8 = skinHelpers.getInstalledSkins("paid");
          const _0x40ade6 = skinHelpers.getInstalledSkins("free");
          return [..._0x27add8, ..._0x40ade6];
        }
      } catch (_0x5746a2) {
        _0x338588.error("Error getting installed skins:", _0x5746a2);
        throw _0x5746a2;
      }
    },
  ],
  [
    "install-skin",
    async (_0x19285c, _0x313463, _0x275e83) => {
      try {
        let _0x32c8c9;
        if (_0x275e83 === "paid") {
          const _0x4a56aa = await customService.getPaidUserSkins();
          _0x32c8c9 = _0x4a56aa.find((_0x21400d) => _0x21400d.id === _0x313463);
        } else {
          const _0x2ae01e = await customService.getFreeSkins();
          _0x32c8c9 = _0x2ae01e.find((_0x454fe9) => _0x454fe9.id === _0x313463);
        }
        if (!_0x32c8c9) {
          const _0x50407b = "Skin with ID " + _0x313463 + " not found";
          _0x338588.error(_0x50407b);
          throw new Error(_0x50407b);
        }
        const _0x709dde = await skinService.fetchFantomeFiles([_0x313463]);
        try {
          await cslolService.installFantomeFile(_0x709dde);
        } catch (_0x4b24bc) {
          const _0x18baaf = _0x4b24bc?.["message"] || "";
          if (
            _0x18baaf.includes("disk space") ||
            _0x18baaf.includes("space on the disk") ||
            _0x18baaf.includes("There is not enough space") ||
            _0x18baaf.includes("ENOSPC") ||
            _0x18baaf.includes("impl_reserve")
          ) {
            _0x338588.error(
              "Not enough disk space while installing skin " + _0x313463
            );
            throw new Error(
              "Not enough disk space on C: drive. Please free up some space and try again."
            );
          }
          if (_0x4b24bc instanceof Error) {
            if (
              _0x4b24bc.message.includes("EPERM") ||
              _0x4b24bc.message.includes("permission")
            ) {
              throw new Error(
                "Permission denied. Please run as administrator."
              );
            } else {
              if (
                _0x4b24bc.message.includes("ENOENT") ||
                _0x4b24bc.message.includes("not found")
              ) {
                throw new Error(
                  "File not found. Check your League path in Settings."
                );
              }
            }
          }
          throw new Error(
            "Installation failed: " +
              (_0x4b24bc?.["message"] || "Unknown error")
          );
        }
        skinHelpers.addInstalledSkin(_0x275e83, _0x313463);
        return {
          success: true,
        };
      } catch (_0x3ae28b) {
        _0x338588.error(
          "Error installing " + _0x275e83 + " skin ID " + _0x313463 + ":",
          _0x3ae28b
        );
        throw _0x3ae28b;
      }
    },
  ],
  [
    "uninstall-skin",
    async (_0x53a096, _0x19b746, _0x3934e5) => {
      try {
        skinHelpers.removeInstalledSkin(_0x3934e5, _0x19b746);
        const _0x5ced12 = store.get("activeSkins." + _0x3934e5) || {};
        if (_0x5ced12[_0x19b746]) {
          delete _0x5ced12[_0x19b746];
          store.set("activeSkins." + _0x3934e5, _0x5ced12);
        }
        if (cslolService) {
          const _0x444421 = _0x4fb86a.join(
            cslolService.getCachePath(),
            _0x19b746.toString()
          );
          try {
            await _0x4d42b5.access(_0x444421);
            await _0x4d42b5.rm(_0x444421, {
              recursive: true,
              force: true,
            });
          } catch (_0x1c7b69) {
            _0x338588.warn(
              "Could not delete skin files from cache (may not exist): " +
                _0x444421,
              _0x1c7b69
            );
          }
        }
        return {
          success: true,
        };
      } catch (_0x2e4343) {
        _0x338588.error("Error uninstalling skin:", _0x2e4343);
        throw _0x2e4343;
      }
    },
  ],
  [
    "get-installed-skins-details",
    async () => {
      try {
        const _0x263032 = skinHelpers.getInstalledSkins("paid");
        const _0x503353 = skinHelpers.getInstalledSkins("free");
        const _0x4cc0bd = await customService.getPaidUserSkins();
        const _0xedd22f = await customService.getFreeSkins();
        const _0x240289 = await importService.getImportedSkins();
        const _0x23c91b = _0x4cc0bd
          .filter((_0x5ca90a) => _0x263032.includes(_0x5ca90a.id))
          .map((_0x13de91) => ({
            id: _0x13de91.id,
            name: _0x13de91.name,
            type: "paid",
            champion: _0x13de91.champion,
            imagePath: _0x13de91.imagePath,
            artistUsername: _0x13de91.artistUsername,
          }));
        const _0x26aee7 = _0xedd22f
          .filter((_0x23b96d) => _0x503353.includes(_0x23b96d.id))
          .map((_0x1490fa) => ({
            id: _0x1490fa.id,
            name: _0x1490fa.name,
            type: "free",
            champion: _0x1490fa.champion,
            imagePath: _0x1490fa.imagePath,
            artistUsername: _0x1490fa.artistUsername,
          }));
        const _0x44615a = _0x240289.map((_0x4b0956) => ({
          id: _0x4b0956.id,
          name: _0x4b0956.name,
          type: "imported",
          champion: "Unknown",
          imagePath: "",
          artistUsername: _0x4b0956.author || "Unknown",
        }));
        return [..._0x23c91b, ..._0x26aee7, ..._0x44615a];
      } catch (_0x412115) {
        _0x338588.error("Error getting installed skins details:", _0x412115);
        throw _0x412115;
      }
    },
  ],
  [
    "run-active-skins",
    async (_0x27b8d5, _0x41c6a3) => {
      try {
        if (installedService.isAnyPatcherRunning()) {
          return {
            success: false,
            error: "A patcher is already running. Please stop it first.",
          };
        }
        try {
          await installedService.createCombinedOverlay(_0x41c6a3);
          return {
            success: true,
          };
        } catch (_0x1c04fc) {
          const _0xb66648 = _0x1c04fc?.["message"] || "";
          if (
            _0xb66648.includes("disk space") ||
            _0xb66648.includes("space on the disk") ||
            _0xb66648.includes("There is not enough space") ||
            _0xb66648.includes("ENOSPC") ||
            _0xb66648.includes("impl_reserve")
          ) {
            _0x338588.error("Not enough disk space while running active skins");
            return {
              success: false,
              error:
                "Not enough disk space on C: drive. Please free up some space and try again.",
            };
          }
          return {
            success: false,
            error: _0x1c04fc?.["message"] || "An unknown error occurred",
          };
        }
      } catch (_0x983305) {
        _0x338588.error("Error running active skins:", _0x983305);
        return {
          success: false,
          error: _0x983305?.["message"] || "An unknown error occurred",
        };
      }
    },
  ],
  [
    "verify-skin-exists",
    async (_0x4dd459, { id: _0x573d5b, type: _0x2827e8 }) => {
      try {
        if (_0x2827e8 === "imported") {
          if (!importService) {
            throw new Error("Import service not initialized");
          }
          return await importService.verifySkinExists(_0x573d5b.toString());
        } else {
          if (!cslolService) {
            throw new Error("CSLOL service not initialized");
          }
          return await cslolService.verifySkinExists(_0x573d5b.toString());
        }
      } catch (_0x7557a8) {
        _0x338588.error("Error verifying skin existence:", _0x7557a8);
        return false;
      }
    },
  ],
  [
    "minimize-window",
    () => {
      _0x338588.info("Minimizing window via IPC call");
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.minimize();
        return {
          success: true,
        };
      }
      return {
        success: false,
        error: "Window not available",
      };
    },
  ],
]);
function registerIpcHandlers() {
  if (handlersRegistered) {
    _0x338588.info("IPC handlers already registered, skipping...");
    return;
  }
  const _0x8c7ae7 = performance.now();
  let _0x140818 = 0;
  try {
    for (const [_0x26a683, _0x4de768] of ipcHandlerRegistry) {
      if (!ipcMain.listenerCount(_0x26a683)) {
        ipcMain.handle(_0x26a683, async (_0x472180, ..._0xf4a5f8) => {
          try {
            const _0x5c7372 = await _0x4de768(_0x472180, ..._0xf4a5f8);
            return _0x5c7372;
          } catch (_0xb30a9b) {
            _0x338588.error(
              "Error in IPC handler " + _0x26a683 + ":",
              _0xb30a9b
            );
            throw _0xb30a9b;
          }
        });
        _0x140818++;
      }
    }
    if (!ipcMain.listenerCount("check-for-updates")) {
      ipcMain.handle("check-for-updates", async () => {
        try {
          await updateService?.["checkForUpdates"]();
        } catch (_0x1a21a9) {
          _0x338588.error("Manual update check failed:", _0x1a21a9);
          throw _0x1a21a9;
        }
      });
      _0x140818++;
    }
    if (!ipcMain.listenerCount("download-update")) {
      ipcMain.handle("download-update", async () => {
        try {
          await updateService?.["downloadUpdate"]();
        } catch (_0x1e5eb3) {
          _0x338588.error("Update download failed:", _0x1e5eb3);
          throw _0x1e5eb3;
        }
      });
      _0x140818++;
    }
    if (!ipcMain.listenerCount("quit-and-install")) {
      ipcMain.handle("quit-and-install", () => {
        updateService?.["quitAndInstall"]();
      });
      _0x140818++;
    }
    const _0x4674d1 = performance.now();
    _0x338588.info(
      "Registered " +
        _0x140818 +
        " IPC handlers in " +
        (_0x4674d1 - _0x8c7ae7).toFixed(2) +
        "ms"
    );
    handlersRegistered = true;
  } catch (_0x5cbd33) {
    _0x338588.error("Failed to register IPC handlers:", _0x5cbd33);
    throw _0x5cbd33;
  }
}
function setupIpcMonitoring() {
  const _0x170578 = new Map();
  ipcMain.on("before-ipc-call", (_0x49740f, _0xbfc72e) => {
    _0x170578.set(_0xbfc72e, performance.now());
  });
  ipcMain.on("after-ipc-call", (_0x542643, _0x31cd26) => {
    const _0x74722f = _0x170578.get(_0x31cd26);
    if (_0x74722f) {
      const _0x33a6b6 = performance.now() - _0x74722f;
      if (_0x33a6b6 > 100) {
        _0x338588.warn(
          "Slow IPC call to " + _0x31cd26 + ": " + _0x33a6b6.toFixed(2) + "ms"
        );
      }
      _0x170578["delete"](_0x31cd26);
    }
  });
}
async function cleanupAllServices() {
  console.log("Cleaning up all services...");
  try {
    if (cslolService) {
      cslolService.clearStatusInterval();
    }
    if (importService) {
      importService.clearStatusTimers();
    }
    if (installedService) {
      installedService.clearAllStatusIntervals();
    }
    if (installedService) {
      await installedService.stopPatcher()["catch"]((_0x33de6c) => {
        console.error("Error stopping patcher during cleanup:", _0x33de6c);
      });
    } else {
      if (importService?.["patcherProcess"]) {
        await importService.stopPatcher()["catch"]((_0x12cb1f) => {
          console.error(
            "Error stopping import patcher during cleanup:",
            _0x12cb1f
          );
        });
      }
      if (cslolService?.["patcherProcess"]) {
        await cslolService.stopPatcher()["catch"]((_0x50d758) => {
          console.error(
            "Error stopping cslol patcher during cleanup:",
            _0x50d758
          );
        });
      }
    }
    if (cslolService) {
      await cslolService.killOrphanedProcesses()["catch"]((_0x4f07cc) => {
        console.error(
          "Error killing orphaned processes during cleanup:",
          _0x4f07cc
        );
      });
    }
    console.log("All services cleaned up successfully");
  } catch (_0xa01687) {
    console.error("Error during service cleanup:", _0xa01687);
  }
}
app.whenReady().then(async () => {
  try {
    const _0x2c4b97 = performance.now();
    _0x338588.info("Starting application...");
    logSystemInfo();
    const _0x79fde = [initializeStore(), validateSecrets()];
    setupIpcMonitoring();
    registerIpcHandlers();
    await Promise.all(_0x79fde);
    if (!mainWindow && !windowCreated) {
      createWindow();
    }
    assetService.initialize();
    const _0x14732d = setInterval(() => {
      const _0x4f8332 =
        installedService?.["isAnyPatcherRunning"]() ||
        importService?.["isPatcherActive"]() ||
        cslolService?.["patcherProcess"] !== null;
      if (!_0x4f8332) {
        if (cslolService) {
          cslolService.clearStatusInterval();
        }
        if (
          importService &&
          typeof importService.clearStatusTimers === "function"
        ) {
          importService.clearStatusTimers();
        }
        if (
          installedService &&
          typeof installedService.clearAllStatusIntervals === "function"
        ) {
          installedService.clearAllStatusIntervals();
        }
      }
    }, 300000);
    app.on("will-quit", () => {
      _0x338588.info("Application is quitting, cleaning up resources...");
      if (_0x14732d) {
        clearInterval(_0x14732d);
      }
      cleanupAllServices()["catch"]((_0x4c1f2d) => {
        _0x338588.error("Error during final cleanup:", _0x4c1f2d);
      });
    });
    const _0x42c6de = performance.now() - _0x2c4b97;
    _0x338588.info("Total startup time: " + _0x42c6de.toFixed(2) + "ms");
  } catch (_0x12999f) {
    _0x338588.error("Failed to start application:", _0x12999f);
    dialog.showErrorBox(
      "Startup Error",
      "Failed to start application. Please check the logs at: " +
        _0x4fb86a.join(app.getPath("userData"), "logs", "main.log")
    );
    app.exit(1);
  }
});
async function cleanupAppData() {
  try {
    const _0x1089ac = app.getPath("userData");
    const _0x1cbb79 = store?.["get"]("paths.cache");
    if (_0x1cbb79) {
      await _0x4d42b5.rm(_0x1cbb79, {
        recursive: true,
        force: true,
      });
      await _0x4d42b5.rm(_0x4fb86a.dirname(_0x1cbb79), {
        recursive: true,
        force: true,
      });
    }
    await _0x4d42b5.rm(_0x1089ac, {
      recursive: true,
      force: true,
    });
    if (cslolService) {
      await cslolService.cleanup();
    }
    if (importService) {
      await importService.cleanupProfiles();
    }
  } catch (_0x5176d4) {
    _0x338588.error("Error during app data cleanup:", _0x5176d4);
  }
}
app.on("window-all-closed", async () => {
  try {
    _0x338588.info("All windows closed, cleaning up...");
    const _0x23841f = updateService?.["isUpdateReady"]() || false;
    if (importService) {
      try {
        await importService.cleanupProfiles();
      } catch (_0xaf9e5f) {
        _0x338588.error("Error cleaning import profiles:", _0xaf9e5f);
      }
    }
    if (cslolService) {
      try {
        await cslolService.cleanup();
      } catch (_0x3d0cd1) {
        _0x338588.error("Error cleaning cslol service:", _0x3d0cd1);
      }
    }
    if (!_0x23841f) {
      updateService = null;
    }
    if (process.platform !== "darwin" || _0x23841f) {
      _0x338588.info("Quitting application...");
      app.quit();
    }
  } catch (_0x3436ee) {
    _0x338588.error("Error during window-all-closed cleanup:", _0x3436ee);
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && !windowCreated) {
    createWindow();
  }
});
process.on("unhandledRejection", (_0x158194) => {
  console.error("Unhandled promise rejection:", _0x158194);
});
app.on("open-url", async (_0xb5f816, _0xd8acfa) => {
  _0xb5f816.preventDefault();
  console.log("Received URL:", _0xd8acfa);
});
app.on("second-instance", (_0x29efbd, _0x97696e) => {
  const _0xe46ee0 = _0x97696e.find((_0x3f0e3d) =>
    _0x3f0e3d.startsWith("divine-manager://")
  );
  if (_0xe46ee0 && mainWindow) {
    mainWindow.focus();
  }
});
