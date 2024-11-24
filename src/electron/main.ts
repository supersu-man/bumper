import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs'
import { execSync } from 'child_process'
import { autoUpdater } from "electron-updater"
import url from 'url';

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

const pathsFilePath = path.join(app.getPath("userData"), "paths.json")
ipcMain.handle('getPaths', () => {
  if(!fs.existsSync(pathsFilePath)) 
    fs.writeFileSync(pathsFilePath, "[]")
  const jsonString = fs.readFileSync(pathsFilePath, 'utf8')
  return JSON.parse(jsonString)
})

ipcMain.handle('addPath', (_event) => {
  const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] })
  if (!result || !result.length) return 'No folder selected'
  const projectPath = result[0]
  const gradle = path.join(projectPath, 'app', 'build.gradle')
  const gradleKt = path.join(projectPath, 'app', 'build.gradle.kts')
  if(!fs.existsSync(gradle) && !fs.existsSync(gradleKt)) return 'Gradle file does not exist'
  if(!fs.existsSync(pathsFilePath)) 
    fs.writeFileSync(pathsFilePath, "[]")
  const jsonString = fs.readFileSync(pathsFilePath, 'utf8')
  const projectsPaths = JSON.parse(jsonString)
  console.log(projectsPaths)
  if(projectsPaths.includes(projectPath)) return 'Path exists'
  projectsPaths.push(projectPath)
  fs.writeFileSync(pathsFilePath, JSON.stringify(projectsPaths))
  return 'success'
})

ipcMain.handle('deletePath', (_event, projectPath: string) => {
  if(!fs.existsSync(pathsFilePath)) 
    fs.writeFileSync(pathsFilePath, "[]")
  const jsonString = fs.readFileSync(pathsFilePath, 'utf8')
  let projectsPaths = JSON.parse(jsonString)
  projectsPaths = projectsPaths.filter((path: string) => path != projectPath)
  fs.writeFileSync(pathsFilePath, JSON.stringify(projectsPaths))
  return 'success'
})

ipcMain.handle('getGradleContent', (_event, projectPath: string) => {
  const gradle = path.join(projectPath, 'app', 'build.gradle')
  const gradleKt = path.join(projectPath, 'app', 'build.gradle.kts')
  if (!fs.existsSync(gradle) && !fs.existsSync(gradleKt)) return 'Gradle file does not exist'
  if (fs.existsSync(gradle)) return fs.readFileSync(gradle, 'utf8')
  else return fs.readFileSync(gradleKt, 'utf8')
})

ipcMain.handle('writeGradleContent', (_event, projectPath: string, content: string, versionName: string) => {
  const gradle = path.join(projectPath, 'app', 'build.gradle')
  const gradleKt = path.join(projectPath, 'app', 'build.gradle.kts')
  if (!fs.existsSync(gradle) && !fs.existsSync(gradleKt)) return 'Gradle file does not exist'
  if (fs.existsSync(gradle)) fs.writeFileSync(gradle, content)
  else fs.writeFileSync(gradleKt, content)

  execSync('git add -A', { cwd: projectPath })
  execSync(`git commit -m v${versionName}`, { cwd: projectPath })
  execSync(`git tag v${versionName}`, { cwd: projectPath })
  execSync('git push', { cwd: projectPath })
  execSync('git push --tags', { cwd: projectPath })
  return 'success'
})

ipcMain.handle('checkStatus', (_event, projectPath: string) => {
  const result = execSync('git status', { cwd: projectPath }).toString()
  if(!result.includes('nothing to commit')) return "uncomitted_changes"
  const result2 = execSync('git push', { cwd: projectPath }).toString()
  if(!result2.includes('up-to-date')) return "cant_push"
  return 'ok'
})