const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

function getChangelogForVersion(version) {
    try {
        const changelogPath = path.join(__dirname, 'CHANGELOG.md');
        if (!fs.existsSync(changelogPath)) {
            return 'Melhorias de desempenho e correções de bugs.';
        }
        const changelog = fs.readFileSync(changelogPath, 'utf-8');
        const versionRegex = new RegExp(`## \\[${version.replace(/\./g, '\\.')}\\][^]*?(?=## \\[|$)`, 's');
        const match = changelog.match(versionRegex);
        if (match) {
            let notes = match[0].replace(/^## \[.*?\].*?\n/, '').trim();
            return notes || 'Melhorias de desempenho e correções de bugs.';
        }
        return 'Melhorias de desempenho e correções de bugs.';
    } catch (err) {
        console.error('Erro ao ler changelog:', err);
        return 'Melhorias de desempenho e correções de bugs.';
    }
}

let mainWindow;
let pipWindow;
let pipDragOffset = { x: 0, y: 0 };
let isPipDragging = false;
let isPipMode = false;
let isQuitting = false;
let autoUpdater = null;

function setupAutoUpdater() {
    try {
        const { autoUpdater: updater } = require('electron-updater');
        autoUpdater = updater;
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.logger = require('electron-log');
        autoUpdater.logger.transports.file.level = 'info';

        autoUpdater.on('checking-for-update', () => console.log('Verificando atualizações...'));
        autoUpdater.on('update-available', (info) => console.log('Atualização disponível:', info.version));
        autoUpdater.on('update-not-available', () => console.log('Nenhuma atualização disponível.'));
        autoUpdater.on('error', (err) => console.error('Erro ao verificar atualizações:', err));
        autoUpdater.on('download-progress', (progressObj) => {
            console.log(`Download em progresso: ${Math.round(progressObj.percent)}%`);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('download-progress', Math.round(progressObj.percent));
            }
        });
        autoUpdater.on('update-downloaded', (info) => {
            console.log('Atualização baixada:', info.version);
            const changelog = getChangelogForVersion(info.version);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-downloaded', {
                    version: info.version,
                    releaseNotes: changelog,
                    releaseDate: info.releaseDate
                });
            }
        });
    } catch (err) {
        console.warn('Auto-updater indisponível:', err.message);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        backgroundColor: '#0a0a0a',
        frame: true,
        title: 'FocoZen Pro'
    });

    mainWindow.loadFile('index.html');
    mainWindow.setMenu(null);
    mainWindow.maximize();

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', () => mainWindow.show());

    if (!app.isPackaged) {
        const bundlePath = path.join(__dirname, 'dist/react/react-app.js');
        let reloadTimer = null;
        try {
            fs.watchFile(bundlePath, { interval: 500 }, () => {
                clearTimeout(reloadTimer);
                reloadTimer = setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        console.log('[Hot Reload] Bundle changed, reloading renderer...');
                        mainWindow.webContents.reload();
                    }
                }, 300);
            });
            console.log('[Hot Reload] Watching for bundle changes...');
        } catch (err) {
            console.warn('[Hot Reload] Could not watch bundle:', err.message);
        }
    }

    mainWindow.on('restore', (e) => {
        if (isPipMode) {
            e.preventDefault();
            mainWindow.minimize();
            if (pipWindow && !pipWindow.isVisible()) { pipWindow.show(); pipWindow.focus(); }
        }
    });

    mainWindow.on('maximize', (e) => {
        if (isPipMode) {
            e.preventDefault();
            mainWindow.minimize();
            if (pipWindow && !pipWindow.isVisible()) { pipWindow.show(); pipWindow.focus(); }
        }
    });

    mainWindow.on('close', (e) => {
        if (isQuitting) return;
        if (mainWindow) {
            e.preventDefault();
            mainWindow.webContents.send('app-close-requested');
        }
    });

    mainWindow.on('closed', () => app.quit());

    createPipWindow();
}

function createPipWindow() {
    pipWindow = new BrowserWindow({
        width: 500,
        height: 228,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    pipWindow.setAlwaysOnTop(true, 'screen-saver');
    pipWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    pipWindow.on('blur', () => {
        if (!pipWindow.isDestroyed()) pipWindow.setAlwaysOnTop(true, 'screen-saver');
    });

    pipWindow.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault();
            pipWindow.hide();
            isPipMode = false;
            if (mainWindow && !mainWindow.isDestroyed()) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('pip-action', 'restore-app');
            }
        }
    });

    pipWindow.loadFile('pip.html');
}

function registerIpcHandlers() {
    ipcMain.on('enter-pip', () => {
        if (!pipWindow || !mainWindow) return;
        isPipMode = true;
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        const bounds = pipWindow.getBounds();
        pipWindow.setPosition(width - bounds.width - 24, height - bounds.height - 24);
        mainWindow.minimize();
        pipWindow.setAlwaysOnTop(true, 'screen-saver');
        pipWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        pipWindow.show();
        pipWindow.focus();
    });

    ipcMain.on('exit-pip', () => {
        isPipMode = false;
        if (pipWindow) pipWindow.hide();
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('pip-action', 'restore-app');
        }
    });

    const gracefulQuit = () => {
        if (isQuitting) return;
        console.log("Encerrando a aplicação FocoZen Pro...");
        isQuitting = true;
        if (pipWindow && !pipWindow.isDestroyed()) pipWindow.close();
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
        app.quit();
    };

    ipcMain.on('close-app', gracefulQuit);
    ipcMain.on('quit-app', gracefulQuit);

    ipcMain.on('pip-update-state', (event, state) => {
        if (pipWindow && !pipWindow.isDestroyed()) {
            if (state.showCompletion && !pipWindow.isVisible()) {
                isPipMode = false;
                if (mainWindow && !mainWindow.isDestroyed()) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.show();
                    mainWindow.focus();
                    mainWindow.webContents.send('pip-action', 'restore-app');
                }
            } else {
                pipWindow.webContents.send('sync-pip-state', state);
            }
        }
    });

    ipcMain.on('pip-action', (event, action, data) => {
        if (action === 'minimize-to-tray') {
            if (pipWindow) pipWindow.hide();
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
            return;
        }
        if (action === 'restore-app') {
            isPipMode = false;
            if (pipWindow) pipWindow.hide();
            if (mainWindow && !mainWindow.isDestroyed()) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('pip-action', 'restore-app');
            }
            return;
        }
        if (action === 'close-app' || action === 'quit-app') { gracefulQuit(); return; }
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pip-action', action, data);
        }
    });

    ipcMain.on('set-volume', (event, volume) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pip-action', 'set-volume', volume);
        }
    });

    ipcMain.on('pip-drag-start', (_event, payload) => {
        if (!pipWindow || pipWindow.isDestroyed()) return;
        const bounds = pipWindow.getBounds();
        pipDragOffset = { x: payload.screenX - bounds.x, y: payload.screenY - bounds.y };
        isPipDragging = true;
    });

    ipcMain.on('pip-drag-move', (_event, payload) => {
        if (!pipWindow || pipWindow.isDestroyed() || !isPipDragging) return;
        pipWindow.setPosition(Math.round(payload.screenX - pipDragOffset.x), Math.round(payload.screenY - pipDragOffset.y), false);
    });

    ipcMain.on('pip-drag-end', () => { isPipDragging = false; });

    ipcMain.handle('get-audio-files', async () => {
        const audioDir = path.join(__dirname, 'assets', 'audio');
        try { return fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav')) : []; } catch (e) { return []; }
    });

    ipcMain.handle('get-audio-path', async (event, filename) => {
        return path.join(__dirname, 'assets', 'audio', filename).replace(/\\/g, '/');
    });

    ipcMain.handle('get-app-version', () => app.getVersion());

    ipcMain.handle('get-changelog-for-version', (event, version) => getChangelogForVersion(version));

    ipcMain.handle('get-full-changelog', () => {
        try {
            const changelogPath = path.join(__dirname, 'CHANGELOG.md');
            if (fs.existsSync(changelogPath)) {
                return fs.readFileSync(changelogPath, 'utf-8').split('\n').slice(3).join('\n').trim();
            }
            return 'Nenhum changelog disponível.';
        } catch (err) {
            console.error('Erro ao ler changelog completo:', err);
            return 'Erro ao carregar changelog.';
        }
    });

    ipcMain.on('install-update', () => {
        setImmediate(() => {
            app.removeAllListeners('window-all-closed');
            if (autoUpdater) autoUpdater.quitAndInstall(true, true);
        });
    });

    ipcMain.on('check-for-updates', (event) => {
        console.log('Recebida solicitação de verificação de atualizações');
        if (!app.isPackaged) {
            event.reply('update-check-result', { available: false, message: 'Verificação de atualizações desabilitada em desenvolvimento' });
            return;
        }
        if (!autoUpdater) {
            event.reply('update-check-result', { available: false, message: 'Auto-updater indisponível' });
            return;
        }
        console.log('Verificando atualizações no GitHub...');
        autoUpdater.checkForUpdates()
            .then((result) => {
                if (result && result.updateInfo && result.updateInfo.version) {
                    const currentVersion = app.getVersion();
                    if (result.updateInfo.version !== currentVersion) {
                        event.reply('update-check-result', { available: true, version: result.updateInfo.version });
                    } else {
                        event.reply('update-check-result', { available: false, message: 'Você já está na versão mais recente!' });
                    }
                } else {
                    event.reply('update-check-result', { available: false, message: 'Você já está na versão mais recente!' });
                }
            })
            .catch((err) => {
                console.error('Erro ao verificar atualizações:', err);
                event.reply('update-check-result', { available: false, message: 'Erro ao verificar atualizações', error: err.message });
            });
    });
}

app.whenReady().then(() => {
    app.commandLine.appendSwitch('disable-site-isolation-trials');
    app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');
    // Disable HTTP cache in development to prevent serving stale script files
    if (!app.isPackaged) {
        app.commandLine.appendSwitch('disable-http-cache');
    }

    setupAutoUpdater();
    registerIpcHandlers();
    createWindow();

    if (!app.isPackaged) {
        console.log('Modo desenvolvimento - verificação de atualizações desabilitada');
    } else if (autoUpdater) {
        autoUpdater.checkForUpdatesAndNotify();
    }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
