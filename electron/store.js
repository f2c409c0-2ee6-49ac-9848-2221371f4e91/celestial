import _0x537e00 from "electron-store";
import _0x465dc3 from "crypto";
import { SECRETS } from "./config/secrets.js";
import _0x15484f from "path";
import _0x282e0f from "fs";
import { app } from "electron";
let store;
async function initializeStore() {
  try {
    if (!app.isReady()) {
      await new Promise((_0x534589) => {
        app.once("ready", () => _0x534589());
      });
    }
    const _0x904985 = _0x15484f.join(app.getPath("userData"), ".keys");
    let _0x36a728;
    try {
      if (_0x282e0f.existsSync(_0x904985)) {
        _0x36a728 = _0x282e0f.readFileSync(_0x904985, "utf8");
      } else {
        _0x36a728 = _0x465dc3.randomBytes(32).toString("hex");
        _0x282e0f.writeFileSync(_0x904985, _0x36a728, {
          mode: 0x180,
        });
      }
    } catch (_0x1ad42c) {
      console.error("Error handling encryption key:", _0x1ad42c);
      throw _0x1ad42c;
    }
    SECRETS.ENCRYPTION_KEY = _0x36a728;
    store = new _0x537e00({
      defaults: {
        settings: {
          leaguePath: "",
          lastUpdated: null,
        },
        auth: {
          token: null,
          refreshToken: null,
          role: null,
          user: null,
        },
        paths: {
          cache: null,
        },
        activeSkins: {
          imported: {},
          paid: {},
          free: {},
        },
        installedSkins: {
          paid: [],
          free: [],
        },
      },
      encryptionKey: _0x36a728,
      clearInvalidConfig: false,
    });
    return store;
  } catch (_0x6c777) {
    console.error("Failed to initialize store:", _0x6c777);
    throw _0x6c777;
  }
}
export const authHelpers = {
  setAuthData: (_0x579a9a, _0x471684) => {
    store.set("auth", {
      token: _0x579a9a.jwt,
      refreshToken: _0x579a9a.refreshToken || null,
      role: _0x579a9a.role,
      user: {
        email: _0x471684,
      },
    });
  },
  clearAuthData: () => {
    store.set("auth", {
      token: null,
      refreshToken: null,
      role: null,
      user: null,
    });
  },
  isAuthenticated: () => {
    return store.get("auth.token") !== null;
  },
  getAuthData: () => {
    return store.get("auth");
  },
  updateToken: (_0xf3b56f, _0x2dfe52) => {
    const _0x47e78b = store.get("auth");
    if (_0x47e78b) {
      store.set("auth", {
        ..._0x47e78b,
        token: _0xf3b56f,
        refreshToken: _0x2dfe52 || _0x47e78b.refreshToken,
      });
    }
  },
};
export const skinHelpers = {
  saveActiveSkins: (_0x4bdbdf, _0x40cde9) => {
    console.log(
      "Store - Saving active skins for " + _0x4bdbdf + ":",
      _0x40cde9
    );
    try {
      const _0x3b24d2 = Object.entries(_0x40cde9).reduce(
        (_0x3bea70, [_0x348e30, _0x44bb66]) => {
          if (_0x44bb66) {
            _0x3bea70[_0x348e30] = _0x44bb66;
          }
          return _0x3bea70;
        },
        {}
      );
      store.set("activeSkins." + _0x4bdbdf, _0x3b24d2);
      console.log(
        "Store - Successfully saved " + _0x4bdbdf + " skins:",
        _0x3b24d2
      );
      const _0x815129 = store.get("activeSkins." + _0x4bdbdf);
      console.log(
        "Store - Verification of saved " + _0x4bdbdf + " skins:",
        _0x815129
      );
    } catch (_0x1a8a32) {
      console.error("Store - Error saving " + _0x4bdbdf + " skins:", _0x1a8a32);
      throw _0x1a8a32;
    }
  },
  getActiveSkins: (_0x2baf06) => {
    console.log("Store - Getting active skins for " + _0x2baf06);
    try {
      const _0x1f1d60 = store.get("activeSkins." + _0x2baf06);
      console.log("Store - Retrieved " + _0x2baf06 + " skins:", _0x1f1d60);
      return _0x1f1d60;
    } catch (_0x561993) {
      console.error(
        "Store - Error getting " + _0x2baf06 + " skins:",
        _0x561993
      );
      throw _0x561993;
    }
  },
  addInstalledSkin: (_0x7fb73e, _0x55cc7b) => {
    console.log(
      "Store - Adding installed skin for " + _0x7fb73e + ":",
      _0x55cc7b
    );
    try {
      const _0x27a2a9 = store.get("installedSkins." + _0x7fb73e) || [];
      if (!_0x27a2a9.includes(_0x55cc7b)) {
        _0x27a2a9.push(_0x55cc7b);
        store.set("installedSkins." + _0x7fb73e, _0x27a2a9);
      }
      console.log(
        "Store - Successfully added " + _0x7fb73e + " skin:",
        _0x55cc7b
      );
      const _0x138ebb = store.get("installedSkins." + _0x7fb73e);
      console.log(
        "Store - Verification of saved " + _0x7fb73e + " installed skins:",
        _0x138ebb
      );
      return _0x27a2a9;
    } catch (_0x191694) {
      console.error(
        "Store - Error adding " + _0x7fb73e + " installed skin:",
        _0x191694
      );
      throw _0x191694;
    }
  },
  removeInstalledSkin: (_0x3dd255, _0x2a1ef9) => {
    console.log(
      "Store - Removing installed skin for " + _0x3dd255 + ":",
      _0x2a1ef9
    );
    try {
      const _0x3a1bd7 = store.get("installedSkins." + _0x3dd255) || [];
      const _0x5aab8a = _0x3a1bd7.filter(
        (_0x15127d) => _0x15127d !== _0x2a1ef9
      );
      store.set("installedSkins." + _0x3dd255, _0x5aab8a);
      console.log(
        "Store - Successfully removed " + _0x3dd255 + " skin:",
        _0x2a1ef9
      );
      const _0x48c2e1 = store.get("installedSkins." + _0x3dd255);
      console.log(
        "Store - Verification of saved " + _0x3dd255 + " installed skins:",
        _0x48c2e1
      );
      return _0x5aab8a;
    } catch (_0x37d5be) {
      console.error(
        "Store - Error removing " + _0x3dd255 + " installed skin:",
        _0x37d5be
      );
      throw _0x37d5be;
    }
  },
  getInstalledSkins: (_0x46303d) => {
    console.log("Store - Getting installed skins for " + _0x46303d);
    try {
      const _0x2aab0e = store.get("installedSkins." + _0x46303d) || [];
      console.log(
        "Store - Retrieved " + _0x46303d + " installed skins:",
        _0x2aab0e
      );
      return _0x2aab0e;
    } catch (_0x6c5e64) {
      console.error(
        "Store - Error getting " + _0x46303d + " installed skins:",
        _0x6c5e64
      );
      throw _0x6c5e64;
    }
  },
};
export { store, initializeStore };
