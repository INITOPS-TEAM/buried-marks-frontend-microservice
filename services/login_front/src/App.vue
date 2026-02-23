<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  if (auth.token && auth.isLoggedIn) {
    const mapUrl = import.meta.env.VITE_MAP_SERVICE_URL
    if (mapUrl) {
      window.location.href = mapUrl
    }
  }
})

</script>

<template>
  <div class="terminal-container">
    <router-view /> 
  </div>
</template>

