<script setup>
import { ref } from 'vue';
import Home from './components/Home.vue';
import Bump from './components/Bump.vue';

let path
const pageNumber = ref(0)
const next = (value) => {
    path = value
    pageNumber.value = 1
}

</script>
<template>
    <Home v-if="pageNumber == 0" @next="next" />
    <Bump v-if="pageNumber == 1" @prev="pageNumber=0" :path="path"/>
</template>