import { API_URL } from "../config/api.js";
import { authHelpers, store } from "../store.js";
import { BrowserWindow } from "electron";
import _0x31d2dd from "electron-log";
export class AuthService {
  constructor() {
    this.isRefreshingToken = false;
    this.tokenRefreshQueue = [];
  }
  ["notifyAuthStateChange"](_0x4b41d5) {
    const _0x493e19 = BrowserWindow.getAllWindows();
    _0x493e19.forEach((_0x35dbf6) => {
      _0x35dbf6.webContents.send("auth-state-changed", _0x4b41d5);
    });
  }
  async ["login"](_0x833bf7) {
    try {
      const _0x2645b2 = await fetch(API_URL + "/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(_0x833bf7),
        credentials: "include",
      });
      if (!_0x2645b2.ok) {
        const _0x4f2655 = await _0x2645b2.json();
        const _0x360bf1 = this.getFriendlyErrorMessage(_0x4f2655.message);
        throw new Error(_0x360bf1);
      }
      const _0x440a7a = await _0x2645b2.json();
      authHelpers.setAuthData(_0x440a7a, _0x833bf7.email);
      this.notifyAuthStateChange(true);
      return _0x440a7a;
    } catch (_0x465ed1) {
      if (
        _0x465ed1 instanceof TypeError &&
        _0x465ed1.message.includes("fetch")
      ) {
        throw new Error(
          "Unable to connect to the server. Please check your internet connection."
        );
      }
      throw _0x465ed1 instanceof Error
        ? _0x465ed1
        : new Error("Something went wrong. Please try again later.");
    }
  }
  async ["refreshToken"]() {
    const _0x240248 = store.get("auth.refreshToken");
    if (!_0x240248) {
      throw new Error("No refresh token available");
    }
    if (this.isRefreshingToken) {
      return new Promise((_0x535732, _0x523c05) => {
        this.tokenRefreshQueue.push({
          resolve: _0x535732,
          reject: _0x523c05,
        });
      });
    }
    this.isRefreshingToken = true;
    try {
      const _0x410c6a = await fetch(API_URL + "/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: _0x240248,
        }),
        credentials: "include",
      });
      if (!_0x410c6a.ok) {
        if (_0x410c6a.status === 403 || _0x410c6a.status === 401) {
          this.logout();
        }
        throw new Error("Failed to refresh token: " + _0x410c6a.status);
      }
      const _0x35eb80 = await _0x410c6a.json();
      authHelpers.updateToken(_0x35eb80.accessToken, _0x35eb80.refreshToken);
      this.processQueue(null, _0x35eb80.accessToken);
      return _0x35eb80.accessToken;
    } catch (_0x476275) {
      this.processQueue(_0x476275);
      throw _0x476275;
    } finally {
      this.isRefreshingToken = false;
    }
  }
  ["processQueue"](_0x103731, _0x59b5f8) {
    if (this.tokenRefreshQueue.length === 0) {
      return;
    }
    if (_0x103731) {
      this.tokenRefreshQueue.forEach(({ reject: _0x5bd83a }) =>
        _0x5bd83a(_0x103731)
      );
    } else if (_0x59b5f8) {
      this.tokenRefreshQueue.forEach(({ resolve: _0x343c51 }) =>
        _0x343c51(_0x59b5f8)
      );
    }
    this.tokenRefreshQueue = [];
  }
  async ["getAccessToken"]() {
    const _0x33c657 = store.get("auth");
    if (!_0x33c657?.["token"]) {
      return null;
    }
    return _0x33c657.token;
  }
  async ["fetchWithAuth"](_0x4bcf84, _0x459630 = {}) {
    const _0x364f09 = await this.getAccessToken();
    if (!_0x364f09) {
      throw new Error("Not authenticated");
    }
    const _0x50b4e2 = {
      ..._0x459630,
      headers: {
        ..._0x459630.headers,
        Authorization: "Bearer " + _0x364f09,
      },
      credentials: "include",
    };
    try {
      let _0x280a96 = await fetch(_0x4bcf84, _0x50b4e2);
      if (_0x280a96.status === 401 || _0x280a96.status === 403) {
        _0x31d2dd.info(
          "Received " + _0x280a96.status + " from API, attempting token refresh"
        );
        try {
          const _0x3e3e32 = await this.refreshToken();
          _0x31d2dd.info("Token refreshed successfully, retrying request");
          _0x280a96 = await fetch(_0x4bcf84, {
            ..._0x50b4e2,
            headers: {
              ..._0x50b4e2.headers,
              Authorization: "Bearer " + _0x3e3e32,
            },
          });
        } catch (_0x52107a) {
          _0x31d2dd.error("Failed to refresh token:", _0x52107a);
        }
      }
      return _0x280a96;
    } catch (_0x83ef64) {
      _0x31d2dd.error(
        "Network error in fetchWithAuth for URL " + _0x4bcf84 + ":",
        _0x83ef64
      );
      throw _0x83ef64;
    }
  }
  ["getFriendlyErrorMessage"](_0xd48f2c) {
    const _0x215c8d = {
      "Invalid credentials": "Incorrect email or password. Please try again.",
      "User not found":
        "No account found with this email. Please check your email or register.",
      "Account locked":
        "Your account has been temporarily locked. Please contact support.",
      "Account not verified":
        "Please verify your email address before logging in.",
    };
    return (
      _0x215c8d[_0xd48f2c] || "Something went wrong. Please try again later."
    );
  }
  async ["logout"]() {
    try {
      const _0x4424ce = store.get("auth");
      if (_0x4424ce?.["token"]) {
        await fetch(API_URL + "/auth/logout", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + _0x4424ce.token,
          },
          credentials: "include",
        })["catch"]((_0x4b2c2c) => {
          _0x31d2dd.error("Error during logout request:", _0x4b2c2c);
        });
      }
    } finally {
      authHelpers.clearAuthData();
      this.notifyAuthStateChange(false);
    }
  }
  ["isAuthenticated"]() {
    return authHelpers.isAuthenticated();
  }
  ["getAuthData"]() {
    return authHelpers.getAuthData();
  }
}
export const authService = new AuthService();
