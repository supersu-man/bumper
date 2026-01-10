import { ipcMain, dialog } from 'electron';
import { FolderPath } from './interfaces';
import { fileOperations } from './files';
import { gitOperations } from './git';
import { GIT_MESSAGES, GIT_STATUS_CODES } from './constants';
import { IpcChannel } from './enums';

export const setupIpcHandlers = (): void => {
  ipcMain.handle(IpcChannel.GetPaths, () => {
    return fileOperations.getFolderPaths();
  });

  ipcMain.handle(IpcChannel.AddPath, () => {
    const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] });

    if (!result || !result.length) {
      return { error: true, message: GIT_MESSAGES.NO_FOLDER_SELECTED };
    }

    const projectPath = result[0];

    if (!fileOperations.validateProjectPath(projectPath)) {
      return { error: true, message: GIT_MESSAGES.NO_GRADLE };
    }

    const projectsPaths = fileOperations.getFolderPaths();

    const existing = projectsPaths.find((obj) => obj.path === projectPath);
    if (existing) {
      return { error: true, message: GIT_MESSAGES.PATH_EXISTS };
    }

    const folderPath = fileOperations.createFolderPath(projectPath);
    if (!folderPath) {
      return { error: true, message: GIT_MESSAGES.NO_GRADLE };
    }

    projectsPaths.push(folderPath);
    fileOperations.writeFolderPaths(projectsPaths);

    return { error: false, folderPath };
  });

  ipcMain.handle(IpcChannel.DeletePath, (_event, projectPath: string) => {
    let projectsPaths = fileOperations.getFolderPaths();
    projectsPaths = projectsPaths.filter((folderPath: FolderPath) => folderPath.path !== projectPath);
    fileOperations.writeFolderPaths(projectsPaths);
    return 'success';
  });

  ipcMain.handle(IpcChannel.GetVersionFiles, (_event, folderPath: FolderPath) => {
    return fileOperations.getVersionFiles(folderPath);
  });

  ipcMain.handle(IpcChannel.WriteFile, (_event, filePath: string, content: string) => {
    fileOperations.writeFile(filePath, content);
    return 'success';
  });

  ipcMain.handle(IpcChannel.CommitTagPush, (_event, projectPath: string, version: string) => {
    try {
      gitOperations.commitTagPush(projectPath, version);
      return { error: false };
    } catch (error) {
      return { error: true, message: (error as Error).message };
    }
  });

  ipcMain.handle(IpcChannel.GitStatus, (_event, projectPath: string) => {
    try {
      return gitOperations.getStatus(projectPath);
    } catch (error) {
      return GIT_STATUS_CODES.UNCOMMITTED_CHANGES;
    }
  });

  ipcMain.handle(IpcChannel.RevertRelease, (_event, projectPath: string) => {
    try {
      gitOperations.revertRelease(projectPath);
      return { error: false };
    } catch (error) {
      return { error: true, message: (error as Error).message };
    }
  });
};
