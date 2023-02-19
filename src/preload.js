const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
    getPaths: () => ipcRenderer.invoke('getPaths'),
    addPath: () => ipcRenderer.invoke('addPath'),
    getContent: (projectPath) => ipcRenderer.invoke('getContent', projectPath),
    bump: (projectPath, ar) => ipcRenderer.invoke('bump', projectPath, ar)
})