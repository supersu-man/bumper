import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs'
import { execSync } from 'child_process'
import { autoUpdater } from "electron-updater"
import url from 'url';
import { FileType } from '../app/constants/enums';
import { FileObject } from '../app/constants/interfaces';

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
  if(projectsPaths.includes(projectPath)) return 'Path already exists'
  projectsPaths.push(projectPath)
  writeFolderPaths(projectsPaths)
  return 'success'
})

ipcMain.handle('deletePath', (_event, projectPath: string) => {
  let projectsPaths = getFolderPaths()
  projectsPaths = projectsPaths.filter((path: string) => path != projectPath)
  writeFolderPaths(projectsPaths)
  return 'success'
})

ipcMain.handle('getVersionFileObj', (_event, projectPath: string) => {
  const gradle = path.join(projectPath, 'app', FileType.Gradle)
  const gradleKt = path.join(projectPath, 'app', FileType.GradleKotlin)
  const myPackage = path.join(projectPath, FileType.Package)
  const myPackageLock = path.join(projectPath, FileType.PackageLock)

  const arObj = []

  if (fs.existsSync(gradle)){
    const obj: FileObject = { content: fs.readFileSync(gradle, 'utf8'), type: FileType.Gradle }
    arObj.push(obj)
  }

  if (fs.existsSync(gradleKt)){
    const obj: FileObject = { content: fs.readFileSync(gradleKt, 'utf8'), type: FileType.GradleKotlin }
    arObj.push(obj)
  }

  if (fs.existsSync(myPackage)){
    const obj: FileObject = { content: fs.readFileSync(myPackage, 'utf8'), type: FileType.Package }
    arObj.push(obj)
  }

  if (fs.existsSync(myPackageLock)){
    const obj: FileObject = { content: fs.readFileSync(myPackageLock, 'utf8'), type: FileType.PackageLock }
    arObj.push(obj)
  }

  return arObj
})

ipcMain.handle('writeVersionFileContent', (_event, projectPath: string, contents: string[]) => {
  const gradle = path.join(projectPath, 'app', FileType.Gradle)
  const gradleKt = path.join(projectPath, 'app', FileType.GradleKotlin)
  const myPackage = path.join(projectPath, FileType.Package)
  const myPackageLock = path.join(projectPath, FileType.PackageLock)

  if (fs.existsSync(gradle)){ 
    fs.writeFileSync(gradle, contents[0])
  }

  if(fs.existsSync(gradleKt)){
    fs.writeFileSync(gradleKt, contents[0])
  }

  if(fs.existsSync(myPackage) && fs.existsSync(myPackageLock)){
    fs.writeFileSync(myPackage, contents[0])
    fs.writeFileSync(myPackageLock, contents[1])
  }
  return 'success'
})

ipcMain.handle('commitTagPush', (_event, projectPath: string, version: string) => {
  execSync('git add -A', { cwd: projectPath })
  execSync(`git commit -m v${version}`, { cwd: projectPath })
  execSync(`git tag v${version}`, { cwd: projectPath })
  execSync('git push', { cwd: projectPath })
  execSync('git push --tags', { cwd: projectPath })
})

ipcMain.handle('checkStatus', (_event, projectPath: string) => {
  const result = execSync('git status', { cwd: projectPath }).toString()
  if(!result.includes('nothing to commit')) return "uncomitted_changes"
  const result2 = execSync('git push', { cwd: projectPath }).toString()
  if(!result2.includes('up-to-date')) return "cant_push"
  return 'ok'
})

const pathsFilePath = path.join(app.getPath("userData"), "paths.json")
const getFolderPaths = () => {
  if(!fs.existsSync(pathsFilePath))
    fs.writeFileSync(pathsFilePath, "[]")
  const jsonString = fs.readFileSync(pathsFilePath, 'utf8')
  return JSON.parse(jsonString||"[]")
}

const writeFolderPaths = (folderPaths: any) => {
  fs.writeFileSync(pathsFilePath, JSON.stringify(folderPaths))
}