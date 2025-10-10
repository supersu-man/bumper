import { contextBridge, ipcRenderer } from 'electron'
import { FolderPath } from './interfaces'
// Expose ipcRenderer.invoke via preload
contextBridge.exposeInMainWorld('api', {
    getPaths: () => ipcRenderer.invoke('getPaths'),
    addPath: () => ipcRenderer.invoke('addPath'),
    deletePath: (projectPath: string) => ipcRenderer.invoke('deletePath', projectPath),
    getVersionFiles: (projectPath: FolderPath) => ipcRenderer.invoke('getVersionFiles', projectPath),
    writeFile: (projectPath: string, content: string) => ipcRenderer.invoke('writeFile', projectPath, content),
    gitStatus: (projectPath: string) => ipcRenderer.invoke('gitStatus', projectPath),
    commitTagPush: (projectPath: string, version: string) => ipcRenderer.invoke('commitTagPush', projectPath, version),

    onUpdateProgress: (callback: (value: string) => void) => ipcRenderer.on("updateProgess", (_event, value) => callback(value))
})