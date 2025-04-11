"use strict";
const { contextBridge, ipcRenderer } = require('electron');
const performanceCache = new Map();
const measureIpcCall = (channel) => {
    const start = performance.now();
    performanceCache.set(channel, start);
    ipcRenderer.send('before-ipc-call', channel);
    return () => {
        const end = performance.now();
        const duration = end - performanceCache.get(channel);
        performanceCache.delete(channel);
        ipcRenderer.send('after-ipc-call', channel);
        if (duration > 100) {
            console.warn(`Slow IPC call to ${channel}: ${duration.toFixed(2)}ms`);
        }
    };
};
const wrapWithPerformance = (fn, channel) => {
    return async (...args) => {
        const endMeasure = measureIpcCall(channel);
        try {
            const result = await fn(...args);
            endMeasure();
            return result;
        }
        catch (error) {
            endMeasure();
            throw error;
        }
    };
};
const api = {
    selectLeaguePath: () => ipcRenderer.invoke('select-league-path'),
    getLeaguePath: () => ipcRenderer.invoke('get-league-path'),
    verifyLeaguePath: (path) => ipcRenderer.invoke('verify-league-path', path),
    setLeaguePath: (path) => ipcRenderer.invoke('set-league-path', path),
    login: (credentials) => ipcRenderer.invoke('login', credentials),
    logout: () => ipcRenderer.invoke('logout'),
    isAuthenticated: () => ipcRenderer.invoke('is-authenticated'),
    getAuthData: () => ipcRenderer.invoke('get-auth-data'),
    onAuthStateChanged: (callback) => {
        ipcRenderer.on('auth-state-changed', (_, isAuthenticated) => callback(isAuthenticated));
        return () => {
            ipcRenderer.removeAllListeners('auth-state-changed');
        };
    },
    getUserCustoms: () => ipcRenderer.invoke('get-user-customs'),
    fetchFantomeFiles: (ids) => ipcRenderer.invoke('fetch-fantome-files', ids),
    installFantomeFiles: (files) => ipcRenderer.invoke('install-fantome-files', files),
    loadAndRunMods: (activeSkins) => ipcRenderer.invoke('load-and-run-mods', activeSkins),
    stopPatcher: async () => {
        await ipcRenderer.invoke('stop-patcher');
    },
    onPatcherStatus: (callback) => {
        const handler = (_event, status) => callback(status);
        ipcRenderer.on('patcher-status', handler);
        return () => {
            ipcRenderer.removeListener('patcher-status', handler);
        };
    },
    getPaidUserSkins: () => ipcRenderer.invoke('get-paid-user-skins'),
    getFreeSkins: () => ipcRenderer.invoke('get-free-skins'),
    getInstalledSkins: (type) => ipcRenderer.invoke('get-installed-skins', type),
    importFantomeFiles: (fileBuffers) => ipcRenderer.invoke('import-fantome-files', fileBuffers),
    getImportedSkins: () => ipcRenderer.invoke('get-imported-skins'),
    removeImportedSkin: (id) => ipcRenderer.invoke('remove-imported-skin', id),
    useImportedSkins: (skinIds) => ipcRenderer.invoke('use-imported-skins', skinIds),
    getInstalledPath: () => ipcRenderer.invoke('get-installed-path'),
    getCachePath: () => ipcRenderer.invoke('get-cache-path'),
    getTempPath: () => ipcRenderer.invoke('get-temp-path'),
    getProfilesPath: () => ipcRenderer.invoke('get-profiles-path'),
    getSecurityStatus: () => ipcRenderer.invoke('get-security-status'),
    onSecurityViolation: (callback) => {
        ipcRenderer.on('security-violation', (_event, reason) => callback(reason));
        return () => {
            ipcRenderer.removeAllListeners('security-violation');
        };
    },
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', (_event, info) => callback(info));
        return () => {
            ipcRenderer.removeAllListeners('update-available');
        };
    },
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (_event, status) => callback(status));
        return () => {
            ipcRenderer.removeAllListeners('update-status');
        };
    },
    onUpdateDownloaded: (callback) => {
        ipcRenderer.on('update-downloaded', () => callback());
        return () => {
            ipcRenderer.removeAllListeners('update-downloaded');
        };
    },
    getLogs: () => ipcRenderer.invoke('get-logs'),
    clearLogs: () => ipcRenderer.invoke('clear-logs'),
    onNewLogEntry: (callback) => {
        ipcRenderer.on('new-log-entry', (_event, entry) => callback(entry));
        return () => {
            ipcRenderer.removeAllListeners('new-log-entry');
        };
    },
    onUpdateNotAvailable: (callback) => {
        ipcRenderer.on('update-not-available', () => callback());
        return () => {
            ipcRenderer.removeAllListeners('update-not-available');
        };
    },
    onUpdateError: (callback) => {
        ipcRenderer.on('update-error', (_event, error) => callback(error));
        return () => {
            ipcRenderer.removeAllListeners('update-error');
        };
    },
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    saveActiveSkins: (type, skins) => ipcRenderer.invoke('save-active-skins', type, skins),
    getActiveSkins: (type) => ipcRenderer.invoke('get-active-skins', type),
    repairInstalledSkins: () => ipcRenderer.invoke('repair-installed-skins'),
    cleanupProfiles: () => ipcRenderer.invoke('cleanup-profiles'),
    cleanupCslolProfiles: () => ipcRenderer.invoke('cleanup-cslol-profiles'),
    installSkin: (skinId, type) => ipcRenderer.invoke('install-skin', skinId, type),
    uninstallSkin: (skinId, type) => ipcRenderer.invoke('uninstall-skin', skinId, type),
    getInstalledSkinsDetails: () => ipcRenderer.invoke('get-installed-skins-details'),
    runActiveSkins: (activeSkinIds) => ipcRenderer.invoke('run-active-skins', activeSkinIds),
    verifySkinExists: (id, type) => ipcRenderer.invoke('verify-skin-exists', { id, type }),
    hardRefresh: () => ipcRenderer.invoke('hard-refresh'),
};
ipcRenderer.on('security-violation', (_event, reason) => {
    console.error('Security violation detected:', reason);
});
ipcRenderer.on('update-error', (_event, error) => {
    console.error('Update error:', error);
});
contextBridge.exposeInMainWorld('api', api);
