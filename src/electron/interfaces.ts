import { FileType, ProjectType } from "./enums"

export interface Version {
    current: string,
    new: string
}

export interface VersionFile extends FilePath{
    content: string
}

export interface FilePath {
    path: string
    type: FileType
}

export interface FolderPath {
    path: string,
    name: string,
    type: ProjectType,
    files: FilePath[]
}