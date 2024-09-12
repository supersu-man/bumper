import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs'
import { execSync } from 'child_process'

let mainWindow: Electron.BrowserWindow;
const assetsPath = process.argv.includes('--dev') ? '../src/assets' : 'browser/assets'
let store: any

import("electron-store").then((value) => {
  store = new value.default()
})

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

ipcMain.handle('getPaths', () => {
  let paths = store.get('paths', [])
  return paths
})

ipcMain.handle('addPath', (_event) => {
  const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] })
  if (!result || !result.length) return 'No folder selected'
  const projectPath = result[0]
  const gradle = path.join(projectPath, 'app', 'build.gradle')
  const gradleKt = path.join(projectPath, 'app', 'build.gradle.kts')
  if(!fs.existsSync(gradle) && !fs.existsSync(gradleKt)) return 'Gradle file does not exist'
  let projectsPaths: string[] = store.get('paths', []) as string[]
  if(projectsPaths.includes(projectPath)) return 'Path exists'
  projectsPaths.push(projectPath)
  store.set('paths', projectsPaths)
  return 'success'
})

ipcMain.handle('deletePath', (_event, projectPath: string) => {
  let projectsPaths: string[] = store.get('paths', []) as string[]
  projectsPaths = projectsPaths.filter(path => path != projectPath);
  store.set('paths', projectsPaths)
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