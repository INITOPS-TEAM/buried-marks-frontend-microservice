<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  if (auth.token && auth.isLoggedIn) {
    window.location.href = '/map/'
  }
})

</script>

<template>
  <div class="terminal-container">
    <router-view /> 
  </div>
</template>

