import { protocol } from "electron";
import _0x3ab39f from "node:path";
import _0x6b6788 from "node:fs";
export class AssetService {
  constructor() {
    this.maxCacheSize = 50;
    this.assetCache = new Map();
  }
  ["initialize"]() {
    protocol.registerFileProtocol("asset", (_0x34d414, _0x2dc9b1) => {
      try {
        const _0x1b290b = _0x34d414.url.replace("asset://", "");
        const _0x3fd631 = this.resolveAssetPath(_0x1b290b);
        if (_0x3fd631) {
          _0x2dc9b1(_0x3fd631);
        } else {
          _0x2dc9b1({
            error: -6,
          });
        }
      } catch (_0x5c07e2) {
        console.error("Asset loading error:", _0x5c07e2);
        _0x2dc9b1({
          error: -2,
        });
      }
    });
  }
  ["resolveAssetPath"](_0x4cb48f) {
    if (this.assetCache.has(_0x4cb48f)) {
      return this.assetCache.get(_0x4cb48f) || null;
    }
    const _0x405fca = process.env.NODE_ENV === "development";
    const _0x235efe = _0x405fca
      ? _0x3ab39f.join(process.cwd(), "public", _0x4cb48f)
      : _0x3ab39f.join(process.resourcesPath, "public", _0x4cb48f);
    if (_0x6b6788.existsSync(_0x235efe)) {
      if (this.assetCache.size >= this.maxCacheSize) {
        const _0x4892f6 = Array.from(this.assetCache.keys())[0];
        if (_0x4892f6) {
          this.assetCache["delete"](_0x4892f6);
        }
      }
      this.assetCache.set(_0x4cb48f, _0x235efe);
      return _0x235efe;
    }
    return null;
  }
  ["cleanup"]() {
    this.assetCache.clear();
  }
}
export const assetService = new AssetService();
