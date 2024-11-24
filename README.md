# Bumper

Bumper is an Electron app that automates version bumping for Android projects, ensuring consistent and up-to-date versioning with ease.

![](githubdocs/screenshot.png)

## Development

Run `npm run start` and `npm run electron-start` simultaneously to use it for development. Angular live reload works as expected. Electron code changes need rebuild.

## Build

Run `npm run electron-package` to build Angular+Electron dist uing Electron Builder.

Note: Don't forget to change appId in package.json.