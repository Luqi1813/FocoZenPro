const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Function to extract changelog for a specific version
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
            // Remove the version header line and clean up
            let notes = match[0].replace(/^## \[.*?\].*?\n/, '').trim();
            return notes || 'Melhorias de desempenho e correções de bugs.';
        }
        
        return 'Melhorias de desempenho e correções de bugs.';
    } catch (err) {
        console.error('Erro ao ler changelog:', err);
        return 'Melhorias de desempenho e correções de bugs.';
    }
}

// OTIMIZAÇÕES AGRESSIVAS DE MEMÓRIA RAM (CHROMIUM)
app.commandLine.appendSwitch('disable-site-isolation-trials'); // Remove multiprocesso de abas soltas (poupa ~80MB)
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling'); 
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256'); // Força lixeiro do V8 rodar mais cedo

let mainWindow;
let pipWindow;
let pipDragOffset = { x: 0, y: 0 };
let isPipDragging = false;
let isPipMode = false;
let isQuitting = false;

// Auto-updater configuration
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Force silent installation for updates
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
    console.log('Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Atualização disponível:', info.version);
});

autoUpdater.on('update-not-available', () => {
    console.log('Nenhuma atualização disponível.');
});

autoUpdater.on('error', (err) => {
    console.error('Erro ao verificar atualizações:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download em progresso: ${Math.round(progressObj.percent)}%`);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', Math.round(progressObj.percent));
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Atualização baixada:', info.version);
    
    // Get changelog from CHANGELOG.md for this version
    const changelog = getChangelogForVersion(info.version);
    
    // Send update info to renderer for custom UI
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-downloaded', {
            version: info.version,
            releaseNotes: changelog,
            releaseDate: info.releaseDate
        });
    }
});

// Expose app version to renderer
ipcMain.handle('get-app-version', () => app.getVersion());

// Get changelog for a specific version from CHANGELOG.md
ipcMain.handle('get-changelog-for-version', (event, version) => {
    return getChangelogForVersion(version);
});

// Get full changelog content
ipcMain.handle('get-full-changelog', () => {
    try {
        const changelogPath = path.join(__dirname, 'CHANGELOG.md');
        if (fs.existsSync(changelogPath)) {
            const content = fs.readFileSync(changelogPath, 'utf-8');
            // Remove the title and intro, keep only version sections
            const sections = content.split('\n').slice(3).join('\n').trim();
            return sections;
        }
        return 'Nenhum changelog disponível.';
    } catch (err) {
        console.error('Erro ao ler changelog completo:', err);
        return 'Erro ao carregar changelog.';
    }
});

// Handle install update request from renderer
ipcMain.on('install-update', () => {
    setImmediate(() => {
        app.removeAllListeners('window-all-closed');
        autoUpdater.quitAndInstall(true, true);
    });
});

// Handle manual update check from settings
ipcMain.on('check-for-updates', (event) => {
    console.log('Recebida solicitação de verificação de atualizações');
    
    if (!app.isPackaged) {
        console.log('Modo desenvolvimento - enviando resposta');
        event.reply('update-check-result', { available: false, message: 'Verificação de atualizações desabilitada em desenvolvimento' });
        return;
    }
    
    console.log('Verificando atualizações no GitHub...');
    autoUpdater.checkForUpdates()
        .then((result) => {
            console.log('Resultado da verificação:', result);
            if (result && result.updateInfo && result.updateInfo.version) {
                const currentVersion = app.getVersion();
                console.log(`Versão atual: ${currentVersion}, Versão disponível: ${result.updateInfo.version}`);
                
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

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        // MELHORIA 1: Janela começa oculta para evitar o "flash branco"
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

    // Open DevTools in development mode
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // MELHORIA 1: Só exibe a janela quando o conteúdo estiver pronto para renderizar
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // HOT RELOADING: watch React bundle and reload when it changes
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
            if (pipWindow && !pipWindow.isVisible()) {
                pipWindow.show();
                pipWindow.focus();
            }
        }
    });

    mainWindow.on('maximize', (e) => {
        if (isPipMode) {
            e.preventDefault();
            mainWindow.minimize();
            if (pipWindow && !pipWindow.isVisible()) {
                pipWindow.show();
                pipWindow.focus();
            }
        }
    });

    mainWindow.on('close', (e) => {
        if (isQuitting) return; // By-pass interception if we are meant to quit!
        if (mainWindow) {
            e.preventDefault();
            mainWindow.webContents.send('app-close-requested');
        }
    });

    mainWindow.on('closed', () => {
        app.quit();
    });

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
        if (!pipWindow.isDestroyed()) {
            pipWindow.setAlwaysOnTop(true, 'screen-saver');
        }
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
    // IPC - CONTROLE DO MODO PIP
    ipcMain.on('enter-pip', () => {
        if (!pipWindow || !mainWindow) return;
        isPipMode = true;
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        const bounds = pipWindow.getBounds();
        pipWindow.setPosition(width - bounds.width - 24, height - bounds.height - 24);
        mainWindow.minimize(); // CORREÇÃO: Minimiza em vez de esconder
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

    // GRACEFUL EXIT (so localStorage has time to flush)
    const gracefulQuit = () => {
        if (isQuitting) return; // Prevent double-calls
        console.log("Encerrando a aplicação FocoZen Pro...");
        isQuitting = true;
        if (pipWindow && !pipWindow.isDestroyed()) pipWindow.close();
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
        app.quit(); // Graceful shutdown
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
        // Intercepta a nova ação de minimizar
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

        // Intercepta se a ação de fechar vier pelo roteador genérico de actions
        if (action === 'close-app' || action === 'quit-app') {
            gracefulQuit();
            return;
        }
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
        pipDragOffset = {
            x: payload.screenX - bounds.x,
            y: payload.screenY - bounds.y
        };
        isPipDragging = true;
    });

    ipcMain.on('pip-drag-move', (_event, payload) => {
        if (!pipWindow || pipWindow.isDestroyed() || !isPipDragging) return;
        const targetX = Math.round(payload.screenX - pipDragOffset.x);
        const targetY = Math.round(payload.screenY - pipDragOffset.y);
        pipWindow.setPosition(targetX, targetY, false);
    });

    ipcMain.on('pip-drag-end', () => {
        isPipDragging = false;
    });

    // Handlers de Áudio
    ipcMain.handle('get-audio-files', async () => {
        const audioDir = path.join(__dirname, 'assets', 'audio');
        try { return fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav')) : []; } catch (e) { return []; }
    });

    ipcMain.handle('get-audio-path', async (event, filename) => {
        return path.join(__dirname, 'assets', 'audio', filename).replace(/\\/g, '/');
    });
}

app.whenReady().then(() => {
    createWindow();
    registerIpcHandlers();
    
    // Check for updates immediately on startup (only in production)
    if (!app.isPackaged) {
        console.log('Modo desenvolvimento - verificação de atualizações desabilitada');
    } else {
        // Check for updates immediately when app opens
        autoUpdater.checkForUpdatesAndNotify();
    }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
