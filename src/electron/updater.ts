import { autoUpdater } from 'electron-updater';
import { WindowManager } from './window-manager';

export const setupAutoUpdater = (): void => {
  autoUpdater.addListener('update-available', () => {
    WindowManager.createUpdateWindow();
  });

  autoUpdater.addListener('download-progress', (info) => {
    WindowManager.sendUpdateProgress(info.percent);
  });

  autoUpdater.addListener('update-downloaded', () => {
    setTimeout(() => {
      WindowManager.closeUpdateWindow();
    }, 1500);
  });

  autoUpdater.checkForUpdatesAndNotify();
};
