import { contextBridge, ipcRenderer } from 'electron'
// Expose ipcRenderer.invoke via preload
contextBridge.exposeInMainWorld('api', {
    getPaths: () => ipcRenderer.invoke('getPaths'),
    addPath: () => ipcRenderer.invoke('addPath'),
    deletePath: (projectPath: string) => ipcRenderer.invoke('deletePath', projectPath),
    getGradleContent: (projectPath: string) => ipcRenderer.invoke('getGradleContent', projectPath),
    writeGradleContent: (projectPath: string, content: string, versionName: string) => ipcRenderer.invoke('writeGradleContent', projectPath, content, versionName),
    checkStatus: (projectPath: string) => ipcRenderer.invoke('checkStatus', projectPath)
})