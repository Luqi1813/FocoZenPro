const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAudioFiles: () => ipcRenderer.invoke('get-audio-files'),
    getAudioPath: (filename) => ipcRenderer.invoke('get-audio-path', filename),
    platform: process.platform,

    enterPip: () => ipcRenderer.send('enter-pip'),
    exitPip: () => ipcRenderer.send('exit-pip'),
    closeApp: () => ipcRenderer.send('quit-app'), // Nova função
    onAppCloseRequested: (callback) => ipcRenderer.on('app-close-requested', callback),
    
    sendPipState: (state) => ipcRenderer.send('pip-update-state', state),
    onSyncPipState: (callback) => ipcRenderer.on('sync-pip-state', (_event, value) => callback(value)),
    
    sendPipAction: (action, data) => ipcRenderer.send('pip-action', action, data),
    onPipAction: (callback) => ipcRenderer.on('pip-action', (_event, action, data) => callback(action, data)),
    setVolume: (volume) => ipcRenderer.send('set-volume', volume),
    pipDragStart: (payload) => ipcRenderer.send('pip-drag-start', payload),
    pipDragMove: (payload) => ipcRenderer.send('pip-drag-move', payload),
    pipDragEnd: () => ipcRenderer.send('pip-drag-end')
});