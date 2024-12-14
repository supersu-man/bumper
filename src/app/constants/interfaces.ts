import { FileType } from "./enums"

export interface VersionType {
    currentVersion: string,
    newVersion: string
}

export interface FileObject {
    content: string,
    type: FileType
}