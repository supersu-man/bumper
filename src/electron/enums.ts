export enum FileType {
  Gradle = 'build.gradle',
  GradleKotlin = 'build.gradle.kts',
  Package = 'package.json',
  PackageLock = 'package-lock.json',
}

export enum ProjectType {
  Gradle = 'gradle',
  Package = 'package',
}

export enum BumpType {
  Major = 'major',
  Minor = 'minor',
  Patch = 'patch',
}

export enum IpcChannel {
  GetPaths = 'getPaths',
  AddPath = 'addPath',
  DeletePath = 'deletePath',
  GetVersionFiles = 'getVersionFiles',
  WriteFile = 'writeFile',
  GitStatus = 'gitStatus',
  CommitTagPush = 'commitTagPush',
  RevertRelease = 'revertRelease',
  UpdateProgress = 'updateProgess',
}