export enum FileType {
    Gradle = 'build.gradle',
    GradleKotlin = 'build.gradle.kts',
    Package = 'package.json',
    PackageLock = 'package-lock.json'
}

export enum ProjectType {
    Gradle = 'gradle',
    Package = 'package',
}

export enum BumpType {
    Major,
    Minor,
    Patch
}