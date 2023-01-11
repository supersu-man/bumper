const { ipcRenderer } = require("electron")
const Store = require('electron-store')
const store = new Store()
const fs = require('fs')
var path = require('path')
const { execSync } = require('child_process')


const uiData = {
  'selectedPath': '',
  'cVersionCode': '',
  'cVersionName': '',
  'nVersionCode': '',
  'nVersionName': ''
}

window.addEventListener('DOMContentLoaded', () => {
  loadPaths()
  initOptionChange()
  initAddProjectButton()
  initModeChange()
  initBumpButton()
})

function loadPaths() {
  var inner = "<option selected>Select project</option>"
  for (const iterator of getPaths()) {
    inner += `<option value="${iterator.path}">${iterator.path}</option>`
  }
  document.getElementById('dropdown-menu').innerHTML = inner
}

function initOptionChange() {
  const dropdownMenu = document.getElementById('dropdown-menu')
  dropdownMenu.onchange = () => {
    const projectPath = dropdownMenu.options[dropdownMenu.selectedIndex].value
    const gradle = path.join(projectPath, 'app', 'build.gradle')
    if (!fs.existsSync(gradle)) return
    uiData.selectedPath = projectPath
    const content = fs.readFileSync(gradle, 'utf8')
    uiData.cVersionCode = /(versionCode [0-9]*)/.exec(content)?.at(0)
    uiData.cVersionName = /(versionName ".*")/.exec(content)?.at(0)
    document.getElementById('btnradio1').checked = true
    setBumpMode('patch')
  }
}

function initAddProjectButton() {
  document.getElementById('addProjectButton').onclick = () => {
    ipcRenderer.invoke("showDialog").then((result) => {
      const gradle = path.join(result.filePaths[0], 'app', 'build.gradle')
      if (!fs.existsSync(gradle)) return //gradle not found
      const paths = getPaths()
      for (const iterator of paths) {
        if (iterator.path == result.filePaths[0]) return  //path already exists
      }
      paths.push({ 'path': result.filePaths[0] })
      savePaths(paths)
      loadPaths()
    })
  }
}

function initModeChange() {
  document.getElementById('btnradio1').onclick = () => { setBumpMode('patch') }
  document.getElementById('btnradio2').onclick = () => { setBumpMode('minor') }
  document.getElementById('btnradio3').onclick = () => { setBumpMode('major') }
}

function initBumpButton() {
  document.getElementById('bump-button').onclick = () => {
    const gradle = path.join(uiData.selectedPath, 'app', 'build.gradle')
    var contents = fs.readFileSync(gradle, 'utf8')
    contents = contents.replace(uiData.cVersionCode, uiData.nVersionCode)
    contents = contents.replace(uiData.cVersionName, uiData.nVersionName)
    fs.writeFileSync(gradle, contents)

    const versionName = uiData.nVersionName.split('"')[1]
    execSync('git add -A', { cwd: uiData.selectedPath })
    execSync(`git commit -m v${versionName}`, { cwd: uiData.selectedPath })
    execSync(`git tag v${versionName}`, { cwd: uiData.selectedPath })
    execSync('git push', { cwd: uiData.selectedPath })
    execSync('git push --tags', { cwd: uiData.selectedPath })

    uiData.cVersionCode = /(versionCode [0-9]*)/.exec(contents)?.at(0)
    uiData.cVersionName = /(versionName ".*")/.exec(contents)?.at(0)
    document.getElementById('btnradio1').click()
  }
}

function setBumpMode(mode) {
  const versionCode = uiData.cVersionCode.split('versionCode ')[1]
  uiData.nVersionCode = 'versionCode ' + (parseInt(versionCode) + 1)
  const versionName = uiData.cVersionName.split('"')[1]
  const digits = versionName.split('.')
  switch (mode) {
    case 'major':
      if (digits.length == 2) {
        const nVersionName = (parseInt(digits[0]) + 1) + '.0'
        uiData.nVersionName = `versionName "${nVersionName}"`
      } else if (digits.length == 3) {
        const nVersionName = (parseInt(digits[0]) + 1) + '.0.0'
        uiData.nVersionName = `versionName "${nVersionName}"`
      }
      break
    case 'minor':
      if (digits.length == 2) {
        const nVersionName = digits[0] + '.' + (parseInt(digits[1]) + 1)
        uiData.nVersionName = `versionName "${nVersionName}"`
      } else if (digits.length == 3) {
        const nVersionName = digits[0] + '.' + (parseInt(digits[1]) + 1) + '.0'
        uiData.nVersionName = `versionName "${nVersionName}"`
      }
      break
    case 'patch':
      if (digits.length == 2) {
        const nVersionName = digits[0] + '.' + (parseInt(digits[1]) + 1)
        uiData.nVersionName = `versionName "${nVersionName}"`
      } else if (digits.length == 3) {
        const nVersionName = digits[0] + '.' + digits[1] + '.' + (parseInt(digits[2]) + 1)
        uiData.nVersionName = `versionName "${nVersionName}"`
      }
      break
    default: break
  }
  document.getElementById('current_version_code').innerText = uiData.cVersionCode
  document.getElementById('current_version_name').innerText = uiData.cVersionName
  document.getElementById('new_version_code').innerText = uiData.nVersionCode
  document.getElementById('new_version_name').innerText = uiData.nVersionName
}

function getPaths() {
  if (!store.has('paths')) {
    store.set('paths', JSON.stringify([]))
  }
  const json = store.get('paths')
  return JSON.parse(json)
}

function savePaths(list) {
  const json = JSON.stringify(list)
  store.set('paths', json)
}

