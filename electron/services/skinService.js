import { Server } from "../config/api.js";
import { store } from "../store.js";
import _0x544936 from "electron-log";
export class SkinService {
  async ["fetchPresignedUrls"](_0x57de00, _0x3764d9) {
    const _0x5787f4 = performance.now();
    try {
      _0x544936.info(
        "Requesting presigned URLs for " + _0x57de00.length + " skins"
      );
      const _0x335464 = await fetch(Server + "/api/user/skins/presigned-urls", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + _0x3764d9,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skinIds: _0x57de00,
        }),
      });
      if (!_0x335464.ok) {
        const _0x26b584 = await _0x335464.text();
        throw new Error(
          "Failed to fetch presigned URLs: " +
            _0x335464.status +
            " " +
            _0x26b584
        );
      }
      const _0x163248 = await _0x335464.json();
      const _0x4d6a25 = new Map();
      for (const _0x56c27e of _0x163248) {
        _0x4d6a25.set(_0x56c27e.skinId, _0x56c27e);
      }
      const _0x16d2e7 = performance.now() - _0x5787f4;
      _0x544936.info(
        "Received " +
          _0x163248.length +
          " presigned URLs in " +
          _0x16d2e7.toFixed(2) +
          "ms"
      );
      return _0x4d6a25;
    } catch (_0x3f5629) {
      _0x544936.error("Error in fetchPresignedUrls:", _0x3f5629);
      throw _0x3f5629;
    }
  }
  async ["downloadWithPresignedUrl"](_0x33a235) {
    const _0x4a27ec = performance.now();
    try {
      if (Date.now() > _0x33a235.expirationTime) {
        throw new Error(
          "Presigned URL for skin " + _0x33a235.skinId + " has expired"
        );
      }
      const _0x7db635 = await fetch(_0x33a235.url, {
        method: "GET",
      });
      if (!_0x7db635.ok) {
        const _0xa309a7 = await _0x7db635.text();
        throw new Error(
          "Failed to download fantome file with presigned URL: " +
            _0x7db635.status +
            " " +
            _0xa309a7
        );
      }
      const _0x295b6e = new Uint8Array(await _0x7db635.arrayBuffer());
      const _0x1075ca = performance.now() - _0x4a27ec;
      _0x544936.info(
        "Downloaded skin " +
          _0x33a235.skinId +
          " from R2 in " +
          _0x1075ca.toFixed(2) +
          "ms"
      );
      return _0x295b6e;
    } catch (_0x2baf5f) {
      _0x544936.error(
        "Error downloading with presigned URL for skin " +
          _0x33a235.skinId +
          ":",
        _0x2baf5f
      );
      throw _0x2baf5f;
    }
  }
  async ["fetchSingleFantome"](_0x33bff6, _0x2e95ef) {
    const _0xf84367 = performance.now();
    try {
      _0x544936.info("Using direct fantome download for skin " + _0x33bff6);
      const _0x1ffcc3 = await fetch(
        Server + "/api/user/skins/fetch-fantome/" + _0x33bff6,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + _0x2e95ef,
            Accept: "application/octet-stream",
          },
        }
      );
      if (!_0x1ffcc3.ok) {
        const _0x492411 = await _0x1ffcc3.text();
        throw new Error(
          "Failed to fetch fantome file: " + _0x1ffcc3.status + " " + _0x492411
        );
      }
      const _0x100335 = new Uint8Array(await _0x1ffcc3.arrayBuffer());
      const _0x14b5f4 = performance.now() - _0xf84367;
      _0x544936.info(
        "Direct download of skin " +
          _0x33bff6 +
          " completed in " +
          _0x14b5f4.toFixed(2) +
          "ms"
      );
      return _0x100335;
    } catch (_0x4fbb66) {
      _0x544936.error(
        "Error in fetchFantomeFile " + _0x33bff6 + ":",
        _0x4fbb66
      );
      throw _0x4fbb66;
    }
  }
  async ["fetchFantomeFiles"](_0x3c9803) {
    const _0x5db7c9 = performance.now();
    _0x544936.info(
      "Starting download for " + _0x3c9803.length + " fantome files"
    );
    const _0xce999c = store.get("auth");
    if (!_0xce999c?.["token"]) {
      throw new Error("Not authenticated");
    }
    const _0xb3f545 = _0xce999c.token;
    try {
      const _0x3e4d83 = new Map();
      let _0x591a7c = false;
      let _0x2d6f6b = null;
      try {
        _0x2d6f6b = await this.fetchPresignedUrls(_0x3c9803, _0xb3f545);
      } catch (_0xb1439b) {
        _0x544936.warn(
          "Failed to fetch presigned URLs, falling back to direct download",
          _0xb1439b
        );
        _0x591a7c = true;
      }
      for (let _0x142655 = 0; _0x142655 < _0x3c9803.length; _0x142655 += 2) {
        const _0x41fcaa = _0x3c9803.slice(_0x142655, _0x142655 + 2);
        const _0x412874 = await Promise.all(
          _0x41fcaa.map(async (_0x57f3ee) => {
            try {
              let _0x45059b;
              if (_0x591a7c || !_0x2d6f6b) {
                _0x45059b = await this.fetchSingleFantome(_0x57f3ee, _0xb3f545);
              } else {
                const _0x3aa079 = _0x2d6f6b.get(_0x57f3ee);
                if (!_0x3aa079) {
                  _0x544936.warn(
                    "No presigned URL found for skin " +
                      _0x57f3ee +
                      ", falling back to direct download"
                  );
                  _0x45059b = await this.fetchSingleFantome(
                    _0x57f3ee,
                    _0xb3f545
                  );
                } else {
                  _0x45059b = await this.downloadWithPresignedUrl(_0x3aa079);
                }
              }
              return {
                id: _0x57f3ee,
                data: _0x45059b,
                success: true,
              };
            } catch (_0x2a3a17) {
              _0x544936.error(
                "Failed to fetch fantome " + _0x57f3ee + ":",
                _0x2a3a17
              );
              return {
                id: _0x57f3ee,
                success: false,
                error: _0x2a3a17,
              };
            }
          })
        );
        for (const _0x107325 of _0x412874) {
          if (_0x107325.success && _0x107325.data) {
            _0x3e4d83.set(_0x107325.id + ".fantome", _0x107325.data);
          }
        }
        await new Promise((_0x526b8c) => setTimeout(_0x526b8c, 50));
      }
      const _0x4b2ee3 = performance.now() - _0x5db7c9;
      _0x544936.info(
        "Completed download of " +
          _0x3e4d83.size +
          "/" +
          _0x3c9803.length +
          " fantome files in " +
          _0x4b2ee3.toFixed(2) +
          "ms"
      );
      return _0x3e4d83;
    } catch (_0x412aa5) {
      _0x544936.error("Error in fetchFantomeFiles:", _0x412aa5);
      throw _0x412aa5;
    }
  }
}
export const skinService = new SkinService();
