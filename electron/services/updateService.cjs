"use strict";
const { app, BrowserWindow } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs').promises;
let importService;
class UpdateService {
    static async initialize(window) {
        const service = new UpdateService();
        if (window) {
            service.setWindow(window);
            if (!service.initialized) {
                service.setupAutoUpdater().catch(err => {
                    service.logger.error('Auto updater setup failed:', err);
                });
                return service;
            }
        }
        return service;
    }
    constructor() {
        this.logger = log;
        this.checkInProgress = false;
        this.updateDownloaded = false;
        this.initialized = false;
        this.skinsBackedUp = false;
        this.window = null;
    }
    setWindow(window) {
        this.window = window;
        if (this.initialized) {
            this.setupEventHandlers();
        }
    }
    setupEventHandlers() {
        if (!this.window)
            return;
        if (!importService) {
            try {
                importService = require('./importService.cjs').importService;
            }
            catch (error) {
                this.logger.error('Failed to load importService:', error);
            }
        }
        autoUpdater.removeAllListeners();
        autoUpdater.on('error', (error) => {
            this.checkInProgress = false;
            this.logger.error('Update error:', error);
            const message = this.getUpdateErrorMessage(error);
            this.window?.webContents.send('update-error', message);
        });
        autoUpdater.on('update-available', (info) => {
            this.logger.info('Update available:', info);
            this.window?.webContents.send('update-available', info);
            this.window?.webContents.send('update-status', 'Downloading update automatically...');
            this.downloadUpdate().catch(err => {
                this.logger.error('Auto download failed:', err);
            });
        });
        autoUpdater.on('update-not-available', () => {
            this.checkInProgress = false;
            this.logger.info('No updates available');
            this.window?.webContents.send('update-not-available');
        });
        autoUpdater.on('download-progress', (progress) => {
            const percent = Math.round(progress.percent);
            const speed = this.formatBytes(progress.bytesPerSecond);
            const transferred = this.formatBytes(progress.transferred);
            const total = this.formatBytes(progress.total);
            const status = `Downloading: ${percent}% (${transferred}/${total} @ ${speed}/s)`;
            this.window?.webContents.send('update-status', status);
        });
        autoUpdater.on('update-downloaded', async () => {
            this.updateDownloaded = true;
            try {
                if (importService) {
                    await this.backupSkinsBeforeUpdate();
                }
                this.window?.webContents.send('update-downloaded');
                this.window?.webContents.send('update-status', 'Update ready. Please restart the application to install.');
            }
            catch (error) {
                this.logger.error('Error during skin backup before update:', error);
                this.window?.webContents.send('update-downloaded');
                this.window?.webContents.send('update-status', 'Update ready, but skin backup failed. Please restart the application to install.');
            }
        });
        this.checkForPostUpdateRestore();
    }
    async backupSkinsBeforeUpdate() {
        try {
            if (!importService)
                return;
            this.logger.info('Backing up imported skins before update...');
            this.window?.webContents.send('update-status', 'Backing up skins before update...');
            const skinCount = await importService.backupImportedSkins();
            if (skinCount > 0) {
                this.logger.info(`Successfully backed up ${skinCount} skins before update`);
                this.window?.webContents.send('update-status', `Backed up ${skinCount} skins. Update ready.`);
                await this.setRestoreSkinsFlag();
                this.skinsBackedUp = true;
            }
            else {
                this.logger.info('No skins to backup before update');
            }
        }
        catch (error) {
            this.logger.error('Failed to backup skins before update:', error);
            throw error;
        }
    }
    async setRestoreSkinsFlag() {
        try {
            const restoreFlagPath = path.join(app.getPath('userData'), 'restore-skins-after-update');
            await fs.writeFile(restoreFlagPath, Date.now().toString());
            this.logger.info('Set restore skins flag for post-update restoration');
        }
        catch (error) {
            this.logger.error('Failed to set restore skins flag:', error);
        }
    }
    async checkForPostUpdateRestore() {
        try {
            if (!importService)
                return;
            const restoreFlagPath = path.join(app.getPath('userData'), 'restore-skins-after-update');
            try {
                await fs.access(restoreFlagPath);
            }
            catch (error) {
                return;
            }
            this.logger.info('Detected post-update skin restoration flag');
            this.window?.webContents.send('update-status', 'Restoring skins after update...');
            const restoredCount = await importService.restoreImportedSkins();
            if (restoredCount > 0) {
                this.logger.info(`Successfully restored ${restoredCount} skins after update`);
                this.window?.webContents.send('update-status', `Restored ${restoredCount} skins after update`);
                try {
                    const backupPath = importService.getBackupPath();
                    this.logger.info(`Cleaning up backup directory: ${backupPath}`);
                    await fs.rm(backupPath, { recursive: true, force: true });
                    this.logger.info('Successfully deleted backup directory after restoration');
                }
                catch (cleanupError) {
                    this.logger.warn('Failed to clean up backup directory:', cleanupError);
                }
            }
            else {
                this.logger.info('No skins needed to be restored after update');
            }
            await fs.unlink(restoreFlagPath);
        }
        catch (error) {
            this.logger.error('Error restoring skins after update:', error);
            try {
                const restoreFlagPath = path.join(app.getPath('userData'), 'restore-skins-after-update');
                await fs.unlink(restoreFlagPath).catch(() => { });
            }
            catch (e) {
            }
        }
    }
    getUpdateErrorMessage(error) {
        if (error.message.includes('Cannot parse blockmap')) {
            return 'Update download started. This may take a few minutes...';
        }
        if (error.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
            return 'Update check timed out. Please check your internet connection.';
        }
        return 'An error occurred while checking for updates. Please try again later.';
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
    async setupAutoUpdater() {
        if (this.initialized) {
            return;
        }
        try {
            this.logger.transports.file.level = 'info';
            autoUpdater.logger = this.logger;
            autoUpdater.autoDownload = true;
            autoUpdater.allowDowngrade = false;
            autoUpdater.allowPrerelease = false;
            autoUpdater.disableWebInstaller = true;
            autoUpdater.requestHeaders = { timeout: 60000 };
            autoUpdater.setFeedURL({
                provider: 'github',
                owner: 'sxrmss',
                repo: 'celestial-releases',
                private: false,
                releaseType: 'release'
            });
            if (this.window) {
                this.setupEventHandlers();
            }
            this.initialized = true;
            this.logger.info('Auto updater setup completed');
            this.logger.info('Performing initial update check at application startup');
            this.checkForUpdates().catch(err => {
                this.logger.error('Initial update check failed:', err);
            });
        }
        catch (error) {
            this.logger.error('Failed to setup auto updater:', error);
            this.initialized = false;
            throw error;
        }
    }
    async checkForUpdates() {
        if (!this.window || this.checkInProgress || !this.initialized) {
            this.logger.info('Update check skipped:', {
                noWindow: !this.window,
                checkInProgress: this.checkInProgress,
                notInitialized: !this.initialized
            });
            return;
        }
        try {
            this.checkInProgress = true;
            this.logger.info('Checking for updates in background...');
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Update check timed out')), 60000);
            });
            await Promise.race([
                autoUpdater.checkForUpdates(),
                timeoutPromise
            ]);
        }
        catch (error) {
            this.checkInProgress = false;
            this.logger.error('Update check failed:', error);
            this.window?.webContents.send('update-error', error.message);
        }
        finally {
            this.checkInProgress = false;
        }
    }
    async downloadUpdate() {
        if (!this.window || this.updateDownloaded) {
            return;
        }
        try {
            this.window.webContents.send('update-status', 'Starting download...');
            await autoUpdater.downloadUpdate();
        }
        catch (error) {
            this.logger.error('Download failed:', error);
            const message = this.getUpdateErrorMessage(error);
            this.window?.webContents.send('update-error', message);
        }
    }
    async quitAndInstall() {
        if (this.updateDownloaded) {
            this.logger.info('Preparing to quit and install update...');
            if (!this.skinsBackedUp && importService) {
                try {
                    this.logger.info('Performing final skin backup before quitting...');
                    await importService.backupImportedSkins();
                    await this.setRestoreSkinsFlag();
                }
                catch (error) {
                    this.logger.error('Final skin backup before quit failed:', error);
                }
            }
            BrowserWindow.getAllWindows().forEach(window => {
                if (!window.isDestroyed()) {
                    window.close();
                }
            });
            setTimeout(() => {
                this.logger.info('Forcing application quit before installing update');
                app.exit(0);
            }, 1000);
            autoUpdater.quitAndInstall(true, true);
        }
        else {
            this.logger.warn('Attempted to quit and install, but no update has been downloaded');
        }
    }
    isUpdateReady() {
        return this.updateDownloaded;
    }
}
module.exports = { UpdateService };
