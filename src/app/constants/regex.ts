export const versionCodeKotlin = /(?<=versionCode = )[0-9]+/
export const versionNameKotlin = /(?<=versionName = ")[0-9](\.[0-9]){1,2}(?=")/

export const versionCodeGradle = /(?<=versionCode )[0-9]+/
export const versionNameGradle = /(?<=versionName ")[0-9](\.[0-9]){1,2}(?=")/

export const versionRegex = /(?<="version": ")[0-9](\.[0-9]){2}(?=")/