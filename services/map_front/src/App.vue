<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (!auth.token || !auth.isLoggedIn) {
    const loginUrl = import.meta.env.VITE_LOGIN_SERVICE_URL
    
    if (loginUrl) {
      window.location.href = loginUrl
    }
  }
})

</script>

<template>
  <div class="terminal-app">
    <router-view /> 
  </div>
</template>
