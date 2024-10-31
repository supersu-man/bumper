import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs'
import { execSync } from 'child_process'
import { autoUpdater } from "electron-updater"
if (process.platform === 'win32') {
  app.setAppUserModelId(app.name);
}
autoUpdater.checkForUpdatesAndNotify()

let mainWindow: Electron.BrowserWindow;
const assetsPath = process.argv.includes('--dev') ? '../src/assets' : 'browser/assets'


function createWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, assetsPath + '/icon.png')
  });
  mainWindow.removeMenu()

  if(process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:4200')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'browser/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow.destroy()
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
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