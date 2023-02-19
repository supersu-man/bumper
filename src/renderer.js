var cVersionCode
var cVersionName
var nVersionCode
var nVersionName

document.getElementById('btnradio1').onclick = () => { setBumpMode('patch') }
document.getElementById('btnradio2').onclick = () => { setBumpMode('minor') }
document.getElementById('btnradio3').onclick = () => { setBumpMode('major') }

const updateUI = () => {
    document.getElementById('current_version_code').innerText = cVersionCode
    document.getElementById('current_version_name').innerText = cVersionName
    document.getElementById('new_version_code').innerText = nVersionCode
    document.getElementById('new_version_name').innerText = nVersionName
}

const setPaths = async () => {
    const paths = await window.api.getPaths()
    var inner = "<option selected>Select project</option>"
    for (const iterator of paths) {
        inner += `<option value="${iterator.path}">${iterator.path}</option>`
    }
    document.getElementById('dropdown-menu').innerHTML = inner
}

setPaths()

const addProjectBtn = document.getElementById('addProjectButton')
addProjectBtn.onclick = async () => {
    await window.api.addPath()
    await setPaths()
}

const dropdownMenu = document.getElementById('dropdown-menu')
dropdownMenu.onchange = async () => {
    const projectPath = dropdownMenu.options[dropdownMenu.selectedIndex].value
    const content = await window.api.getContent(projectPath)
    cVersionCode = /(versionCode [0-9]*)/.exec(content)?.at(0)
    cVersionName = /(versionName ".*")/.exec(content)?.at(0)
    setBumpMode('patch')
}

const setBumpMode = (mode) => {
    const versionCode = cVersionCode.split('versionCode ')[1]
    nVersionCode = 'versionCode ' + (parseInt(versionCode) + 1)
    const versionName = cVersionName.split('"')[1]
    const digits = versionName.split('.')
    switch (digits.length) {
        case 2:
            if (mode == 'major')
                nVersionName = `versionName "${(parseInt(digits[0]) + 1) + '.0'}"`
            if (mode == 'minor' || mode == 'patch')
                nVersionName = `versionName "${digits[0] + '.' + (parseInt(digits[1]) + 1)}"`
            break
        case 3:
            if (mode == 'major')
                nVersionName = `versionName "${(parseInt(digits[0]) + 1) + '.0.0'}"`
            if (mode == 'minor')
                nVersionName = `versionName "${digits[0] + '.' + (parseInt(digits[1]) + 1) + '.0'}"`
            if (mode == 'patch')
                nVersionName = `versionName "${digits[0] + '.' + digits[1] + '.' + (parseInt(digits[2]) + 1)}"`
    }
    updateUI()
}

document.getElementById('bump-button').onclick = async () => {
    const projectPath = dropdownMenu.options[dropdownMenu.selectedIndex].value
    await window.api.bump(projectPath, [cVersionCode, nVersionCode, cVersionName, nVersionName])
    cVersionCode = nVersionCode
    cVersionName = nVersionName
    document.getElementById('btnradio1').click()
}