const { app, BrowserWindow } = require('electron')
const path = require('path')

require('update-electron-app')()


if (require('electron-squirrel-startup')) app.quit()

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    resizable: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  mainWindow.removeMenu()
  //mainWindow.webContents.openDevTools()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})


const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const Store = require('electron-store')
const store = new Store()
const execSync = require('child_process').execSync

ipcMain.handle('getPaths', () => {
  if (!store.has('paths')) {
    store.set('paths', JSON.stringify([]))
  }
  const json = store.get('paths')
  return JSON.parse(json)
})

ipcMain.handle('addPath', () => {
  const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] })
  const gradle = path.join(result[0], 'app', 'build.gradle')
  const gradleKt = path.join(result[0], 'app', 'build.gradle.kts')
  if (!fs.existsSync(gradle) && !fs.existsSync(gradleKt)) return //gradle not found
  const json = store.get('paths')
  const paths = JSON.parse(json)
  for (const iterator of paths) {
    if (iterator.path == result[0]) return //path already exists
  }
  paths.push({ 'path': result[0] })
  store.set('paths', JSON.stringify(paths))
})

ipcMain.handle('getContent', (event, projectPath) => {
  const gradle = path.join(projectPath, 'app', 'build.gradle')
  const gradleKt = path.join(projectPath, 'app', 'build.gradle.kts')
  if (!fs.existsSync(gradle) && !fs.existsSync(gradleKt)) return
  let content;
  if (fs.existsSync(gradle)) content = fs.readFileSync(gradle, 'utf8')
  if (fs.existsSync(gradleKt)) content = fs.readFileSync(gradleKt, 'utf8')
  console.log(content)
  return content
})

ipcMain.handle('bump', (event, projectPath, ar) => {
  const gradle = path.join(projectPath, 'app', 'build.gradle')
  const gradleKt = path.join(projectPath, 'app', 'build.gradle.kts')
  if (!fs.existsSync(gradle) && !fs.existsSync(gradleKt)) return
  let content;
  if (fs.existsSync(gradle)) {
    content = fs.readFileSync(gradle, 'utf8')
    content = content.replace(ar[0], ar[1]).replace(ar[2], ar[3])
    fs.writeFileSync(gradle, content)
  }
  if (fs.existsSync(gradleKt)) {
    content = fs.readFileSync(gradleKt, 'utf8')
    content = content.replace(ar[0], ar[1]).replace(ar[2], ar[3])
    fs.writeFileSync(gradleKt, content)
  }
  const versionName = /([0-9]+\.[0-9]+\.[0-9]+)/.exec(ar[3])[0] || /([0-9]+\.[0-9]+)/.exec(ar[3])[0]
  console.log(content)
  execSync('git add -A', { cwd: projectPath })
  execSync(`git commit -m v${versionName}`, { cwd: projectPath })
  execSync(`git tag v${versionName}`, { cwd: projectPath })
  execSync('git push', { cwd: projectPath })
  execSync('git push --tags', { cwd: projectPath })
})