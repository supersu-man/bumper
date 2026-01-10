import { app } from 'electron';
import { WindowManager } from './window-manager';
import { setupAutoUpdater } from './updater';
import { setupIpcHandlers } from './ipc-handlers';

if (process.platform === 'win32') {
  app.setAppUserModelId(app.name);
}

setupAutoUpdater();
setupIpcHandlers();

app.on('ready', () => {
  WindowManager.createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (WindowManager.getMainWindow() === null) {
    WindowManager.createMainWindow();
  }
});

