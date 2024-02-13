<script setup>
import { ref } from 'vue'

const props = defineProps({
    path: String
})
const emits = defineEmits(["prev"])

const projectName = ref(props.path?.split("/").slice(-1)[0])
const cVersionCode = ref(-1)
const cVersionName = ref('')
const nVersionCode = ref(-1)
const nVersionName = ref('')


window.api.getContent(props.path).then((content) => {
    cVersionCode.value = /(versionCode [0-9]+)/.exec(content)?.at(0) || /(versionCode = [0-9]+)/.exec(content)?.at(0)
    cVersionName.value = /(versionName ".+")/.exec(content)?.at(0) || /(versionName = ".+")/.exec(content)?.at(0)
    setBumpMode('patch')
})

const setBumpMode = (mode) => {
    const oldVersionCode = /([0-9]+)/.exec(cVersionCode.value)[0]
    nVersionCode.value = cVersionCode.value.replace(oldVersionCode, parseInt(oldVersionCode)+1)
    const oldVersionName = /([0-9]+\.[0-9]+\.[0-9]+)/.exec(cVersionName.value)[0] || /([0-9]+\.[0-9]+)/.exec(cVersionName.value)[0]
    const digits = oldVersionName.match(/[0-9]+/g)
    switch (digits.length) {
        case 2:
            if (mode == 'major')
                nVersionName.value = cVersionName.value.replace(oldVersionName, `${parseInt(digits[0])+1}.0`)
            if (mode == 'minor' || mode == 'patch')
                nVersionName.value = cVersionName.value.replace(oldVersionName, `${digits[0]}.${parseInt(digits[1])+1}`)
            break
        case 3:
            if (mode == 'major')
                nVersionName.value = cVersionName.value.replace(oldVersionName, `${parseInt(digits[0])+1}.0.0`)
            if (mode == 'minor')
                nVersionName.value = cVersionName.value.replace(oldVersionName, `${digits[0]}.${parseInt(digits[1])+1}.0`)
            if (mode == 'patch')
                nVersionName.value = cVersionName.value.replace(oldVersionName, `${digits[0]}.${digits[1]}.${parseInt(digits[2])+1}`)
    }
}

const bumpProject = () => {
    window.api.bump(props.path, [cVersionCode.value, nVersionCode.value, cVersionName.value, nVersionName.value]).then(() => {
        cVersionCode.value = nVersionCode.value
        cVersionName.value = nVersionName.value
        setBumpMode('patch')
    })
}

</script>

<template class="position-relative">
    <div class="px-5 py-4">
        <label class="h5">Project type:</label><label class="fs-5 ms-3">Android</label>
        <br>
        <label class="h5">Project name:</label><label class="fs-5 ms-3">{{ projectName }}</label>
    </div>
    <div class="px-5 py-4">
        <div class="row">
            <div class="col h5">Current:</div>
            <div class="col h5">New:</div>
        </div>
        <div class="row">
            <div class="col fs-5">{{ cVersionCode }}</div>
            <div class="col fs-5">{{ nVersionCode }}</div>
        </div>
        <div class="row">
            <div class="col fs-5">{{ cVersionName }}</div>
            <div class="col fs-5">{{ nVersionName }}</div>
        </div>
    </div>

    <div class="btn-group px-5 py-4">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio1" checked hidden>
        <label class="btn button" for="btnradio1" @click="setBumpMode('patch')">Patch</label>

        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" hidden>
        <label class="btn button" for="btnradio2" @click="setBumpMode('minor')">Minor</label>

        <input type="radio" class="btn-check" name="btnradio" id="btnradio3" hidden>
        <label class="btn button" for="btnradio3" @click="setBumpMode('major')">Major</label>
    </div>

    <button class="button position-absolute bottom-0 start-0 mx-5 my-4" @click="emits('prev')">Prev</button>
    <button class="button position-absolute bottom-0 end-0 mx-5 my-4" @click="bumpProject">Bump</button>
</template>