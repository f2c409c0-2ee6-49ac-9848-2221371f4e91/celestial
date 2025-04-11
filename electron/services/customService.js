import { Server } from "../config/api.js";
import _0x3944f9 from "electron-log";
import { authService } from "./authService.js";
export class CustomService {
  async ["getPaidUserSkins"]() {
    try {
      const _0x1c52fb = Server + "/api/user/skins/paid";
      const _0x1b941f = await authService.fetchWithAuth(_0x1c52fb, {
        headers: {
          Accept: "application/json",
        },
      });
      if (!_0x1b941f.ok) {
        const _0x1029d6 = await _0x1b941f.text();
        throw new Error(
          "Failed to fetch paid user skins: " +
            _0x1b941f.status +
            " " +
            _0x1029d6
        );
      }
      const _0x314b5a = await _0x1b941f.json();
      return _0x314b5a;
    } catch (_0x458c43) {
      _0x3944f9.error("Error fetching paid user skins:", _0x458c43);
      throw _0x458c43;
    }
  }
  async ["getFreeSkins"]() {
    try {
      _0x3944f9.info("Making request to fetch free skins...");
      const _0x16f64b = await authService.fetchWithAuth(
        Server + "/api/user/skins/free",
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      if (!_0x16f64b.ok) {
        const _0x19a025 = await _0x16f64b.text();
        _0x3944f9.error(
          "Failed to fetch free skins:",
          _0x16f64b.status,
          _0x19a025
        );
        throw new Error(
          "Failed to fetch free skins: " + _0x16f64b.status + " " + _0x19a025
        );
      }
      const _0x1ad713 = await _0x16f64b.json();
      return _0x1ad713;
    } catch (_0x3f74f1) {
      _0x3944f9.error("Error fetching free skins:", _0x3f74f1);
      throw _0x3f74f1;
    }
  }
}
export const customService = new CustomService();
