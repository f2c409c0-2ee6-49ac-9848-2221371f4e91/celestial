import { dialog } from "electron";
import _0x351016 from "node:path";
import { promises as _0x10d2be } from "node:fs";
import { store, initializeStore } from "../store.js";
export class LeaguePathService {
  constructor() {
    this.initialized = false;
    this.initPromise = null;
  }
  async ["ensureInitialized"]() {
    if (!this.initialized) {
      if (!this.initPromise) {
        this.initPromise = (async () => {
          try {
            if (!store) {
              await initializeStore();
            }
            this.initialized = true;
          } catch (_0x57cbb4) {
            console.error("Failed to initialize LeaguePathService:", _0x57cbb4);
            throw _0x57cbb4;
          }
        })();
      }
      await this.initPromise;
    }
  }
  async ["getSettings"]() {
    await this.ensureInitialized();
    const _0x13d644 = store.get("settings");
    if (!_0x13d644 || typeof _0x13d644 !== "object" || !_0x13d644.leaguePath) {
      const _0x4b56c7 = {
        leaguePath: "",
        lastUpdated: Date.now(),
      };
      store.set("settings", _0x4b56c7);
      return _0x4b56c7;
    }
    return _0x13d644;
  }
  async ["updateSettings"](_0x1a0d64) {
    await this.ensureInitialized();
    const _0x4802b4 = await this.getSettings();
    store.set("settings", {
      ..._0x4802b4,
      ..._0x1a0d64,
      lastUpdated: Date.now(),
    });
  }
  async ["selectLeaguePath"]() {
    try {
      await this.ensureInitialized();
      const _0x2ed37a = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
          {
            name: "League of Legends",
            extensions: ["exe"],
          },
        ],
        defaultPath: _0x351016.join(
          "C:",
          "Riot Games",
          "League of Legends",
          "Game"
        ),
      });
      if (!_0x2ed37a.canceled && _0x2ed37a.filePaths.length > 0) {
        const _0x448fae = _0x2ed37a.filePaths[0];
        const _0x1a7e61 = await this.verifyLeaguePath(_0x448fae);
        if (_0x1a7e61.isValid) {
          await this.setLeaguePath(_0x448fae);
          return _0x448fae;
        } else {
          throw new Error(_0x1a7e61.error || "Invalid League of Legends path");
        }
      }
      return null;
    } catch (_0x5ab87e) {
      console.error("Error selecting League path:", _0x5ab87e);
      throw _0x5ab87e;
    }
  }
  async ["getLeaguePath"]() {
    const _0x11e83a = await this.getSettings();
    return _0x11e83a.leaguePath;
  }
  async ["verifyLeaguePath"](_0x3b7986) {
    try {
      await _0x10d2be.access(_0x3b7986);
      const _0x568083 = _0x351016.basename(_0x3b7986);
      if (_0x568083 !== "League of Legends.exe") {
        return {
          isValid: false,
          error: "Selected file is not the League of Legends executable",
        };
      }
      return {
        isValid: true,
      };
    } catch (_0x26b69f) {
      return {
        isValid: false,
        error: "Selected file does not exist",
      };
    }
  }
  async ["setLeaguePath"](_0x4bf029) {
    try {
      console.log("Storing League path:", _0x4bf029);
      await this.updateSettings({
        leaguePath: _0x4bf029,
      });
      console.log("League path stored successfully");
      return {
        success: true,
      };
    } catch (_0x42feb3) {
      console.error("Error saving League path:", _0x42feb3);
      throw new Error("Failed to save League path");
    }
  }
}
export const leaguePathService = new LeaguePathService();
