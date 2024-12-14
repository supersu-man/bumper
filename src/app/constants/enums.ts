export enum FileType {
    Gradle = 'build.gradle',
    GradleKotlin = 'build.gradle.kts',
    Package = 'package.json',
    PackageLock = 'package-lock.json'
}

export enum BumpType {
    Major,
    Minor,
    Patch
}