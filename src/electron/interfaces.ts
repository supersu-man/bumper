import { FileType, ProjectType } from './enums';

export interface Version {
  current: string;
  new: string;
}

export interface FilePath {
  path: string;
  type: FileType;
}

export interface VersionFile extends FilePath {
  content: string;
}

export interface FolderPath {
  path: string;
  name: string;
  type: ProjectType;
  files: FilePath[];
}

export interface ElectronAPI {
  
  getPaths: () => Promise<FolderPath[]>;
  addPath: () => Promise<{ error: boolean; message?: string; folderPath?: FolderPath }>;
  deletePath: (projectPath: string) => Promise<string>;

  getVersionFiles: (folderPath: FolderPath) => Promise<any[]>;
  writeFile: (filePath: string, content: string) => Promise<string>;

  gitStatus: (projectPath: string) => Promise<number>;
  commitTagPush: (projectPath: string, version: string) => Promise<{ error: boolean; message?: string }>;
  revertRelease: (projectPath: string) => Promise<{ error: boolean; message?: string }>;

  onUpdateProgress: (callback: (progress: number) => void) => void;
}