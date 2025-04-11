import { execSync } from "child_process";
import _0x3cd7d1 from "os";
export class SecurityService {
  constructor() {
    this.isWindows = process.platform === "win32";
    this.lastMemoryCheck = 0;
    this.memoryCheckInterval = 15000;
    this.securityCheckInterval = null;
    if (process.env.NODE_ENV === "production") {
      this.initializeSecurityChecks();
    }
  }
  ["initializeSecurityChecks"]() {
    try {
      const _0x564aba = this.detectDebugger();
      const _0x15a251 = this.detectVM();
      const _0x2dd24f = this.detectEmulation();
      console.log("Security Checks:", {
        debugger: _0x564aba,
        vm: _0x15a251,
        emulation: _0x2dd24f,
      });
      if (_0x564aba || (_0x15a251 && _0x2dd24f)) {
        this.handleSecurityViolation("Security check failed");
      }
      this.setupSecurityMonitoring();
    } catch (_0x5845f0) {
      console.error("Security check error:", _0x5845f0);
    }
  }
  ["detectDebugger"]() {
    try {
      if (
        process.env._debugProcess ||
        process.env._debugEnd ||
        process.env._debugPause
      ) {
        return true;
      }
      const _0x100af4 = ["NODE_OPTIONS", "ELECTRON_DEBUG_NOTIFICATIONS"];
      if (_0x100af4.some((_0x539795) => process.env[_0x539795])) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  ["detectVM"]() {
    try {
      if (this.isWindows) {
        const _0x36f7c2 = execSync("systeminfo").toString().toLowerCase();
        const _0x1e3a68 = [
          "vmware",
          "virtualbox",
          "hyperv",
          "kvm",
          "virtual machine",
          "qemu",
          "bhyve",
        ];
        const _0x1edc63 = _0x1e3a68.some(
          (_0x331541) =>
            _0x36f7c2.includes("manufacturer:s*" + _0x331541) ||
            _0x36f7c2.includes("model:s*" + _0x331541)
        );
        if (_0x1edc63) {
          return true;
        }
        try {
          const _0x2ac900 = execSync("sc query state= all")
            .toString()
            .toLowerCase();
          const _0x4e602a = [
            "vmtools",
            "vboxservice",
            "vmhgfs",
            "vmmouse",
            "vmrawdsk",
            "vmusbmouse",
            "vmvss",
            "vmscsi",
            "vmxnet",
          ];
          return _0x4e602a.some((_0x3c7990) => _0x2ac900.includes(_0x3c7990));
        } catch {}
        return false;
      } else {
        try {
          const _0x3d11e0 = execSync("dmidecode -s system-manufacturer")
            .toString()
            .toLowerCase();
          const _0x4043d1 = ["vmware", "virtualbox", "kvm", "qemu", "xen"];
          return _0x4043d1.some((_0x49fd7c) => _0x3d11e0.includes(_0x49fd7c));
        } catch {
          const _0x56db95 = execSync("cat /proc/cpuinfo")
            .toString()
            .toLowerCase();
          return (
            _0x56db95.includes("hypervisor") ||
            _0x56db95.includes("virtualization")
          );
        }
      }
    } catch (_0x116929) {
      console.error("VM detection error:", _0x116929);
      return false;
    }
  }
  ["detectEmulation"]() {
    try {
      const _0x4165b6 = this.isWindows
        ? execSync("wmic cpu get name,manufacturer").toString()
        : execSync("cat /proc/cpuinfo").toString();
      const _0x4456de = ["qemu", "virtual", "hyperv", "bhyve", "kvm", "vmware"];
      const _0x260a6f = _0x4456de.some((_0x3c1f12) =>
        _0x4165b6.toLowerCase().includes(_0x3c1f12)
      );
      if (_0x260a6f) {
        return true;
      }
      const _0x371b73 = _0x3cd7d1.totalmem();
      if (_0x371b73 < 2147483648) {
        return true;
      }
      if (this.isWindows) {
        try {
          const _0x2c5eb3 = execSync(
            "wmic computersystem get model,manufacturer"
          ).toString();
          const _0x234b8d = ["android", "emulator", "virtual"];
          if (
            _0x234b8d.some((_0x384f86) =>
              _0x2c5eb3.toLowerCase().includes(_0x384f86)
            )
          ) {
            return true;
          }
        } catch {}
      }
      return false;
    } catch (_0x36888a) {
      console.error("Emulation detection error:", _0x36888a);
      return false;
    }
  }
  ["setupSecurityMonitoring"]() {
    if (this.securityCheckInterval) {
      clearInterval(this.securityCheckInterval);
      this.securityCheckInterval = null;
    }
    process.on("warning", (_0x37a37c) => {
      if (_0x37a37c.name === "SecurityWarning") {
        this.handleSecurityViolation("Security warning detected");
      }
    });
  }
  ["handleSecurityViolation"](_0x550e09) {
    console.error("Security violation detected: " + _0x550e09);
    this.cleanSensitiveData();
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
  ["cleanSensitiveData"]() {
    try {
      if (this.securityCheckInterval) {
        clearInterval(this.securityCheckInterval);
        this.securityCheckInterval = null;
      }
      const { store: _0x45e0d4 } = require("../store.js");
      _0x45e0d4.clear();
      if (global.gc) {
        global.gc();
      }
    } catch (_0x5816a8) {
      console.error("Error cleaning sensitive data:", _0x5816a8);
    }
  }
}
export const securityService = new SecurityService();
