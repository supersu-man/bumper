import { BrowserWindow } from 'electron';
import { WINDOW_CONFIG } from './constants';
import { getAppUrl, getAssetUrl, resolveElectronPath } from './utility';

export class WindowManager {
  private static mainWindow: Electron.BrowserWindow | null = null;
  private static updateWindow: Electron.BrowserWindow | null = null;

  static getMainWindow(): Electron.BrowserWindow | null {
    return this.mainWindow;
  }

  static getUpdateWindow(): Electron.BrowserWindow | null {
    return this.updateWindow;
  }

  static createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      height: WINDOW_CONFIG.MAIN.height,
      width: WINDOW_CONFIG.MAIN.width,
      title: WINDOW_CONFIG.MAIN.title,
      icon: getAssetUrl('favicon.ico'),
      webPreferences: {
        preload: resolveElectronPath('preload.js'),
      },
    });

    this.mainWindow.removeMenu();
    // this.mainWindow.webContents.openDevTools()
    const route = getAppUrl();
    this.mainWindow.loadURL(route);

    this.mainWindow.on('closed', () => {
      this.mainWindow?.destroy();
      this.mainWindow = null;
    });
  }

  static createUpdateWindow(): void {
    this.updateWindow = new BrowserWindow({
      height: WINDOW_CONFIG.UPDATE.height,
      width: WINDOW_CONFIG.UPDATE.width,
      resizable: WINDOW_CONFIG.UPDATE.resizable,
      closable: WINDOW_CONFIG.UPDATE.closable,
      title: WINDOW_CONFIG.UPDATE.title,
      icon: getAssetUrl('favicon.ico'),
      webPreferences: {
        preload: resolveElectronPath('preload.js'),
      },
    });

    this.updateWindow.removeMenu();
    const route = getAppUrl('update');
    this.updateWindow.loadURL(route);

    this.updateWindow.on('closed', () => {
      this.updateWindow?.destroy();
      this.updateWindow = null;
    });
  }

  static closeUpdateWindow(): void {
    if (this.updateWindow) {
      this.updateWindow.closable = true;
      this.updateWindow.close();
    }
  }

  static sendUpdateProgress(percent: number): void {
    this.updateWindow?.webContents.send('updateProgess', percent);
  }
}
