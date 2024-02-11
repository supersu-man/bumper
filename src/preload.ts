import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('api', {
    getPaths: () => ipcRenderer.invoke('getPaths'),
    addPath: () => ipcRenderer.invoke('addPath'),
    getContent: (projectPath: any) => ipcRenderer.invoke('getContent', projectPath),
    bump: (projectPath: any, ar: any) => ipcRenderer.invoke('bump', projectPath, ar)
})