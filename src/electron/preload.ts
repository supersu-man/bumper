import { contextBridge, ipcRenderer } from 'electron'
// Expose ipcRenderer.invoke via preload
contextBridge.exposeInMainWorld('api', {
    getPaths: () => ipcRenderer.invoke('getPaths'),
    addPath: () => ipcRenderer.invoke('addPath'),
    deletePath: (projectPath: string) => ipcRenderer.invoke('deletePath', projectPath),
    getVersionFileObj: (projectPath: string) => ipcRenderer.invoke('getVersionFileObj', projectPath),
    writeVersionFileContent: (projectPath: string, contents: string[]) => ipcRenderer.invoke('writeVersionFileContent', projectPath, contents),
    commitTagPush: (projectPath: string, version: string) => ipcRenderer.invoke('commitTagPush', projectPath, version),

    onUpdateProgress: (callback: (value: string) => void) => ipcRenderer.on("updateProgess", (_event, value) => callback(value))
})