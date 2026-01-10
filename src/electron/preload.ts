
import { contextBridge, ipcRenderer } from 'electron'
import { FolderPath, ElectronAPI } from './interfaces'

const api: ElectronAPI = {
    getPaths: () => ipcRenderer.invoke(IpcChannel.GetPaths),
    addPath: () => ipcRenderer.invoke('addPath'),
    deletePath: (projectPath: string) => ipcRenderer.invoke('deletePath', projectPath),
    getVersionFiles: (projectPath: FolderPath) => ipcRenderer.invoke('getVersionFiles', projectPath),
    writeFile: (projectPath: string, content: string) => ipcRenderer.invoke('writeFile', projectPath, content),
    gitStatus: (projectPath: string) => ipcRenderer.invoke('gitStatus', projectPath),
    commitTagPush: (projectPath: string, version: string) => ipcRenderer.invoke('commitTagPush', projectPath, version),
    revertRelease: (projectPath: string) => ipcRenderer.invoke('revertRelease', projectPath),

    onUpdateProgress: (callback: (progress: number) => void) => ipcRenderer.on("updateProgess", (_event, progress) => callback(progress))
}

contextBridge.exposeInMainWorld('api',  api)

export enum IpcChannel {
  GetPaths = 'getPaths',
  AddPath = 'addPath',
  DeletePath = 'deletePath',
  GetVersionFiles = 'getVersionFiles',
  WriteFile = 'writeFile',
  GitStatus = 'gitStatus',
  CommitTagPush = 'commitTagPush',
  RevertRelease = 'revertRelease',
  UpdateProgress = 'updateProgess',
}