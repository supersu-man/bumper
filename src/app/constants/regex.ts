import { ElectronAPI } from "../../electron/interfaces";

export const Regex = {
    VersionCodeKotlin: /(?<=versionCode = )[0-9]+/,
    VersionNameKotlin: /(?<=versionName = ")[0-9](\.[0-9]){1,2}(?=")/,
    VersionCodeGradle: /(?<=versionCode )[0-9]+/,
    VersionNameGradle: /(?<=versionName ")[0-9](\.[0-9]){1,2}(?=")/,
    VersionRegex: /(?<="version": ")[0-9](\.[0-9]){2}(?=")/,
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
