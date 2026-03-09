<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const statusMessage = ref('')
const token = ref(''); 
const isSuccess = ref(false)

onMounted(() => {
    // Getting a token
    token.value = route.query.token
    if (!token.value) statusMessage.value = 'ERROR: INVALID OR MISSING INVITE TOKEN'
})

const handleRegister = async () => {
    if (password.value !== confirmPassword.value) { statusMessage.value = 'ERROR: PASSWORDS DO NOT MATCH'; return }
    if (password.value.length < 3) { statusMessage.value = 'ERROR: PASSWORD TOO SHORT (MIN 3 SYMBOLS)'; return }

    try {
        // Sending to the backend
        const response = await api.post('/api/accept-invite/', {
            token: token.value,
            username: username.value,
            password: password.value
    })

        if (response.status === 201 || response.status === 200) {
            isSuccess.value = true
            statusMessage.value = 'REGISTRATION SUCCESSFUL. REDIRECTING...'
            setTimeout(() => { router.push('/') }, 2000)
    }
    } catch (err) {
    isSuccess.value = false
    statusMessage.value = err.response?.data?.error || 'CRITICAL ERROR: REGISTRATION FAILED'
    }
}
</script>

<template>
    <div class="terminal-container">
        <div class="box">
            <h2>Initial Authorization</h2>
            <p class="token-info" v-if="token">TOKEN STATUS: <span :class="{ 'active-text': token }">ACTIVE</span></p>
    
            <div v-if="token && !isSuccess">
                <input v-model="username" placeholder="CHOOSE USERNAME" autocomplete="off" />
                <input v-model="password" type="password" placeholder="NEW PASSWORD" />
                <input v-model="confirmPassword" type="password" placeholder="CONFIRM PASSWORD" />
        
                <button class="btn-primary" @click="handleRegister" :disabled="!username || !password || !confirmPassword">
                Finalize Access
                </button>
            </div>

            <p v-if="statusMessage" :class="['status-msg', { 'success-text': isSuccess }]">
                {{ statusMessage }}
            </p>

            <router-link to="/" class="back-link">Return to Login</router-link>
        </div>
    </div>
</template>

<style scoped>
.terminal-container { display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; }
.box { background: var(--bg-box); border: var(--border-main); padding: 40px; border-radius: 8px; width: 320px; text-align: center; backdrop-filter: blur(10px); box-shadow: 0 0 30px rgba(0, 0, 0, 0.5); }
h2 { color: var(--accent); margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px; }
input { width: 100%; padding: 10px; margin-bottom: 15px; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--accent); color: white; border-radius: 4px; box-sizing: border-box; outline: none; }
input:focus { box-shadow: 0 0 10px var(--accent); }
.btn-primary { width: 100%; margin-top: 15px; padding: 12px; background: var(--accent); color: black; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.status-msg { color: var(--danger); margin-top: 20px; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; border: 1px solid var(--danger); padding: 10px; }
.success-text { color: var(--accent); border-color: var(--accent); }
.token-info { font-size: 0.7rem; color: #888; margin-bottom: 10px; }
.active-text { color: var(--accent); }
.back-link { display: block; margin-top: 20px; font-size: 0.8rem; color: var(--text-dim); text-decoration: none; }
.back-link:hover { color: var(--accent); }
</style>