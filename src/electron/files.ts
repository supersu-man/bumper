import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { FolderPath, VersionFile } from './interfaces';
import { ProjectType, FileType } from './enums';

const pathsFilePath = path.join(app.getPath("userData"), "paths.json");

export const fileOperations = {
  getFolderPaths: (): FolderPath[] => {
    if (!fs.existsSync(pathsFilePath)) {
      fs.writeFileSync(pathsFilePath, "[]");
    }
    const jsonString = fs.readFileSync(pathsFilePath, 'utf8');
    return JSON.parse(jsonString || "[]") as FolderPath[];
  },

  writeFolderPaths: (folderPaths: FolderPath[]): void => {
    fs.writeFileSync(pathsFilePath, JSON.stringify(folderPaths));
  },

  getVersionFiles: (folderPath: FolderPath): VersionFile[] => {
    if (folderPath.type === ProjectType.Gradle) {
      const versionFile: VersionFile = {
        content: fs.readFileSync(folderPath.files[0].path, 'utf8'),
        ...folderPath.files[0],
      };
      return [versionFile];
    }

    if (folderPath.type === ProjectType.Package) {
      const packageFile: VersionFile = {
        content: fs.readFileSync(folderPath.files[0].path, 'utf8'),
        ...folderPath.files[0],
      };
      const packageLockFile: VersionFile = {
        content: fs.readFileSync(folderPath.files[1].path, 'utf8'),
        ...folderPath.files[1],
      };
      return [packageFile, packageLockFile];
    }

    return [];
  },

  writeFile: (filePath: string, content: string): void => {
    fs.writeFileSync(filePath, content);
  },

  validateProjectPath: (projectPath: string): boolean => {
    const gradle = path.join(projectPath, 'app', FileType.Gradle);
    const gradleKt = path.join(projectPath, 'app', FileType.GradleKotlin);
    const myPackage = path.join(projectPath, FileType.Package);
    const myPackageLock = path.join(projectPath, FileType.PackageLock);

    return fs.existsSync(gradle) || fs.existsSync(gradleKt) || fs.existsSync(myPackage) || fs.existsSync(myPackageLock);
  },

  createFolderPath: (projectPath: string): FolderPath | null => {
    const gradle = path.join(projectPath, 'app', FileType.Gradle);
    const gradleKt = path.join(projectPath, 'app', FileType.GradleKotlin);
    const myPackage = path.join(projectPath, FileType.Package);
    const myPackageLock = path.join(projectPath, FileType.PackageLock);

    const baseName = path.basename(projectPath);

    if (fs.existsSync(gradle)) {
      return { name: baseName, path: projectPath, type: ProjectType.Gradle, files: [{ path: gradle, type: FileType.Gradle }] };
    }

    if (fs.existsSync(gradleKt)) {
      return { name: baseName, path: projectPath, type: ProjectType.Gradle, files: [{ path: gradleKt, type: FileType.GradleKotlin }] };
    }

    if (fs.existsSync(myPackage) && fs.existsSync(myPackageLock)) {
      return {
        name: baseName,
        path: projectPath,
        type: ProjectType.Package,
        files: [
          { path: myPackage, type: FileType.Package },
          { path: myPackageLock, type: FileType.PackageLock },
        ],
      };
    }

    return null;
  },
};
