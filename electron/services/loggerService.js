import { app } from "electron";
import _0x1df7fa from "electron-log";
import _0x3d07fd from "path";
import _0x3dc7c6 from "fs";
class LoggerService {
  constructor() {
    this.initialized = false;
    this.initialize();
  }
  ["initialize"]() {
    if (this.initialized) {
      return;
    }
    try {
      const _0x46efc7 = app.getPath("userData");
      const _0x2c8984 = _0x3d07fd.join(_0x46efc7, "logs");
      if (!_0x3dc7c6.existsSync(_0x2c8984)) {
        _0x3dc7c6.mkdirSync(_0x2c8984, {
          recursive: true,
        });
      }
      _0x1df7fa.transports.file.resolvePathFn = () =>
        _0x3d07fd.join(_0x2c8984, "main.log");
      _0x1df7fa.transports.file.level = "debug";
      _0x1df7fa.transports.console.level = "debug";
      _0x1df7fa.catchErrors({
        showDialog: false,
        onError: (_0x327d45) => {
          this.error("Caught error:", _0x327d45);
        },
      });
      this.initialized = true;
      this.info("Logger initialized");
      this.info("Logs path:", _0x2c8984);
    } catch (_0x4b350b) {
      console.error("Failed to initialize logger:", _0x4b350b);
    }
  }
  ["info"](..._0x3ff543) {
    _0x1df7fa.info(..._0x3ff543);
  }
  ["error"](..._0x668aa6) {
    _0x1df7fa.error(..._0x668aa6);
  }
  ["warn"](..._0xba8c80) {
    _0x1df7fa.warn(..._0xba8c80);
  }
  ["debug"](..._0x597d10) {
    _0x1df7fa.debug(..._0x597d10);
  }
  ["getLogPath"]() {
    return _0x1df7fa.transports.file.getFile().path;
  }
  ["getLogs"]() {
    try {
      const _0x5ba043 = _0x1df7fa.transports.file.getFile();
      const _0x17b03b = _0x3dc7c6.readFileSync(_0x5ba043.path, "utf8");
      return _0x17b03b
        .split("\n")
        .filter((_0x1dfe62) => _0x1dfe62)
        .map((_0xbd57ce) => {
          const [_0x46168e, _0x4731cf, ..._0x590435] = _0xbd57ce.split(" ");
          return {
            timestamp: _0x46168e,
            level: _0x4731cf,
            message: _0x590435.join(" "),
          };
        });
    } catch (_0x469f1f) {
      console.error("Error reading logs:", _0x469f1f);
      return [];
    }
  }
  ["clearLogs"]() {
    const _0x56a38f = _0x1df7fa.transports.file.getFile();
    _0x3dc7c6.writeFileSync(_0x56a38f.path, "");
  }
  ["onNewEntry"](_0x119878) {
    _0x1df7fa.hooks.push((_0x2ada89, _0x35ef59) => {
      if (_0x35ef59 === _0x1df7fa.transports.file) {
        _0x119878({
          timestamp: new Date().toISOString(),
          level: _0x2ada89.level,
          message: _0x2ada89.data.join(" "),
        });
      }
      return _0x2ada89;
    });
  }
}
export const loggerService = new LoggerService();
