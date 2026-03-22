<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (!auth.token || !auth.isLoggedIn) {
    window.location.href = '/'
  }
})
</script>

<template>
  <div class="terminal-app">
    <router-view /> 
  </div>
</template>
