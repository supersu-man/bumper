import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs'
import { execSync } from 'child_process'
import { autoUpdater } from "electron-updater"
import url from 'url';
import { FileType, ProjectType } from '../app/constants/enums';
import { FolderPath, VersionFile } from '../app/constants/interfaces';

if (process.platform === 'win32') {
  app.setAppUserModelId(app.name);
}
autoUpdater.addListener("update-available", (info) => {
  createUpdateWindow()
})
autoUpdater.addListener("download-progress", (info) => {
  updateWindow.webContents.send('updateProgess', info.percent)
})
autoUpdater.addListener("update-downloaded", () => {
  setTimeout(() => {
    updateWindow.closable = true
    updateWindow.close()
  }, 1500);
})
autoUpdater.checkForUpdatesAndNotify()

let mainWindow: Electron.BrowserWindow;
let updateWindow: Electron.BrowserWindow;
const assetsPath = process.argv.includes('--dev') ? '../src/assets' : 'browser/assets'
const indexUrl = url.format({
  pathname: path.join(__dirname, 'browser/index.html'),
  protocol: 'file',
  slashes: true,
  hash: '#'
})

function createMainWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 1000,
    title: "Bumper",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, assetsPath + '/icon.png')
  });
  mainWindow.removeMenu()
  if(process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:4200/#')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(indexUrl)
  }

  mainWindow.on('closed', () => {
    mainWindow.destroy()
  });
}

function createUpdateWindow() {
  updateWindow = new BrowserWindow({
    height: 180,
    width: 500,
    resizable: false,
    closable: false,
    title: "Update found",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, assetsPath + '/icon.png')
  });
  updateWindow.removeMenu()
  if(process.argv.includes('--dev')) {
    updateWindow.loadURL('http://localhost:4200/#/testing')
    updateWindow.webContents.openDevTools()
  } else {
    updateWindow.loadURL(indexUrl + '/testing')
  }

  updateWindow.on('closed', () => {
    updateWindow.destroy()
  });

}

app.on('ready', () => {
  createMainWindow()
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

ipcMain.handle('getPaths', () => {
  return getFolderPaths()
})

ipcMain.handle('addPath', (_event) => {
  const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] })
  if (!result || !result.length) return 'No folder selected'
  const projectPath = result[0]

  const gradle = path.join(projectPath, 'app', FileType.Gradle)
  const gradleKt = path.join(projectPath, 'app', FileType.GradleKotlin)
  const myPackage = path.join(projectPath, FileType.Package)
  const myPackageLock = path.join(projectPath, FileType.PackageLock)

  if(!fs.existsSync(gradle) && !fs.existsSync(gradleKt) && !fs.existsSync(myPackage) && !fs.existsSync(myPackageLock))
    return 'Could not find build.gradle | build.gradle.kts | package.json | package_lock.json'


  const projectsPaths = getFolderPaths()

  const existing = projectsPaths.find((obj) => { obj.path == projectPath })
  if(existing) return 'Path already exists'

  if(fs.existsSync(gradle)) {
    const folderPath: FolderPath = { name: path.basename(projectPath), path: projectPath, type: ProjectType.Gradle , files: [{ path: gradle, type: FileType.Gradle }] }
    projectsPaths.push(folderPath)
  }

  if(fs.existsSync(gradleKt)) {
    const folderPath: FolderPath = { name: path.basename(projectPath), path: projectPath, type: ProjectType.Gradle , files: [{ path: gradleKt, type: FileType.GradleKotlin }] }
    projectsPaths.push(folderPath)
  }

  if(fs.existsSync(myPackage) && fs.existsSync(myPackageLock)) {
    const folderPath: FolderPath = { name: path.basename(projectPath), path: projectPath, type: ProjectType.Package , files: [{ path: myPackage, type: FileType.Package }, { path: myPackageLock, type: FileType.PackageLock }] }
    projectsPaths.push(folderPath)
  }

  writeFolderPaths(projectsPaths)
  return 'success'
})

ipcMain.handle('deletePath', (_event, projectPath: string) => {
  let projectsPaths = getFolderPaths()
  projectsPaths = projectsPaths.filter((folderPath: FolderPath) => folderPath.path != projectPath)
  writeFolderPaths(projectsPaths)
  return 'success'
})

ipcMain.handle('getVersionFiles', (_event, folderPath: FolderPath) => {
  if(folderPath.type == ProjectType.Gradle) {
      const versionFile: VersionFile = { content: fs.readFileSync(folderPath.files[0].path, 'utf8'), ...folderPath.files[0] }
      return [versionFile]
  }
  if(folderPath.type == ProjectType.Package) {
    const packageFile: VersionFile = { content: fs.readFileSync(folderPath.files[0].path, 'utf8'), ...folderPath.files[0] }
    const packageLockFile: VersionFile = { content: fs.readFileSync(folderPath.files[1].path, 'utf8'), ...folderPath.files[1] }
    return [packageFile, packageLockFile]
  }

  return
})

ipcMain.handle('writeFile', (_event, filePath: string, content: string) => {
  fs.writeFileSync(filePath, content)
  return 'success'
})

ipcMain.handle('commitTagPush', (_event, projectPath: string, version: string) => {
  execSync('git add -A', { cwd: projectPath })
  execSync(`git commit -m v${version}`, { cwd: projectPath })
  execSync(`git tag v${version}`, { cwd: projectPath })
  execSync('git push', { cwd: projectPath })
  execSync('git push --tags', { cwd: projectPath })
})

const pathsFilePath = path.join(app.getPath("userData"), "paths.json")
const getFolderPaths = () => {
  if(!fs.existsSync(pathsFilePath))
    fs.writeFileSync(pathsFilePath, "[]")
  const jsonString = fs.readFileSync(pathsFilePath, 'utf8')
  return JSON.parse(jsonString||"[]") as FolderPath[]
}

const writeFolderPaths = (folderPaths: FolderPath[]) => {
  fs.writeFileSync(pathsFilePath, JSON.stringify(folderPaths))
}