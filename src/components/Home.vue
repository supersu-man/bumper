<script setup>
import { ref } from 'vue'

const selectedPath = ref('')
const paths = ref([])

function setPaths() {
    window.api.getPaths().then((v) => {
        paths.value = v
    })
}
setPaths()

function addProject() {
    window.api.addPath().then(() => {
        setPaths()
    })
}

const emits = defineEmits(["next"])


</script>

<template class="position-relative">
    <div class="px-5 py-4">
        <h5>Select an Android project to bump the version</h5>
        <select class="form-select form-select-md" v-model="selectedPath">
            <option v-for="path in paths" :value="path.path">{{ path.path }}</option>
        </select>
    </div>
    <div class="px-5 py-2">
        <h5>Add a new project</h5>
        <button type="button" class="button" @click="addProject">Add project</button>
    </div>
    <button class="button position-absolute bottom-0 end-0 mx-5 my-4" :disabled="!selectedPath" @click="emits('next', selectedPath)">Next</button>
</template>