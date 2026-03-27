const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

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

    // MELHORIA 1: Só exibe a janela quando o conteúdo estiver pronto para renderizar
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

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
        width: 320,
        height: 180,
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
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
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
            pipWindow.webContents.send('sync-pip-state', state);
        }
    });

    ipcMain.on('pip-action', (event, action, data) => {
        // Intercepta a nova ação de minimizar
        if (action === 'minimize-to-tray') {
            if (pipWindow) pipWindow.hide();
            return; 
        }

        if (action === 'restore-app') {
            isPipMode = false;
            if (pipWindow) pipWindow.hide();
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
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
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
