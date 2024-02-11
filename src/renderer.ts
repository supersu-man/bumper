import './styles.css';


var cVersionCode: any
var cVersionName: any
var nVersionCode: any
var nVersionName: any

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
    const paths = await (window as any).api.getPaths()
    var inner = "<option selected>Select project</option>"
    for (const iterator of paths) {
        inner += `<option value="${iterator.path}">${iterator.path}</option>`
    }
    document.getElementById('dropdown-menu').innerHTML = inner
}

setPaths()

const addProjectBtn = document.getElementById('addProjectButton')
addProjectBtn.onclick = async () => {
    await (window as any).api.addPath()
    await setPaths()
}

const dropdownMenu = document.getElementById('dropdown-menu') as any
dropdownMenu.onchange = async () => {
    const projectPath = dropdownMenu.options[dropdownMenu.selectedIndex].value
    const content = await (window as any).api.getContent(projectPath)
    cVersionCode = /(versionCode [0-9]+)/.exec(content)?.at(0) || /(versionCode = [0-9]+)/.exec(content)?.at(0)
    cVersionName = /(versionName ".+")/.exec(content)?.at(0) || /(versionName = ".+")/.exec(content)?.at(0)
    setBumpMode('patch')
}

const setBumpMode = (mode: any) => {
    const oldVersionCode = /([0-9]+)/.exec(cVersionCode)[0]
    nVersionCode = cVersionCode.replace(oldVersionCode, parseInt(oldVersionCode)+1)
    const oldVersionName = /([0-9]+\.[0-9]+\.[0-9]+)/.exec(cVersionName)[0] || /([0-9]+\.[0-9]+)/.exec(cVersionName)[0]
    const digits = oldVersionName.match(/[0-9]+/g)
    switch (digits.length) {
        case 2:
            if (mode == 'major')
                nVersionName = cVersionName.replace(oldVersionName, `${parseInt(digits[0])+1}.0`)
            if (mode == 'minor' || mode == 'patch')
                nVersionName = cVersionName.replace(oldVersionName, `${digits[0]}.${parseInt(digits[1])+1}`)
            break
        case 3:
            if (mode == 'major')
                nVersionName = cVersionName.replace(oldVersionName, `${parseInt(digits[0])+1}.0.0`)
            if (mode == 'minor')
                nVersionName = cVersionName.replace(oldVersionName, `${digits[0]}.${parseInt(digits[1])+1}.0`)
            if (mode == 'patch')
                nVersionName = cVersionName.replace(oldVersionName, `${digits[0]}.${digits[1]}.${parseInt(digits[2])+1}`)
    }
    updateUI()
}

document.getElementById('bump-button').onclick = async () => {
    const projectPath = dropdownMenu.options[dropdownMenu.selectedIndex].value
    await (window as any).api.bump(projectPath, [cVersionCode, nVersionCode, cVersionName, nVersionName])
    cVersionCode = nVersionCode
    cVersionName = nVersionName
    document.getElementById('btnradio1').click()
}