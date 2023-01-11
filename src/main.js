const { app, BrowserWindow } = require('electron')
const path = require('path')
const { ipcMain, dialog } = require("electron")
const { autoUpdater } = require("electron-updater")
autoUpdater.checkForUpdatesAndNotify()

try {
  require('electron-reloader')(module)
} catch { }

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    resizable: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('src/index.html')
  mainWindow.removeMenu()
  //mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  initIPC()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

function initIPC() {
  ipcMain.handle("showDialog", () => {
    const path = dialog.showOpenDialog({ properties: ['openDirectory'] })
    return path
  })
}
