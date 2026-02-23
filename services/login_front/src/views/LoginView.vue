<script setup>
import { ref } from 'vue'
import api from '../api'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const step = ref(1)
const loginInput = ref('')
const passwordInput = ref('')
const secretInput = ref('')
const statusMessage = ref('')

const handleLogin = async () => {
  try {
    const response = await api.post('/auth/login', {
      username: loginInput.value,
      password: passwordInput.value
    })

    if (response.data && response.data.token) {
      auth.setToken(response.data.token)
      step.value = 2 
      statusMessage.value = ''
    }
  } catch (err) {
    statusMessage.value = 'Error: Invalid credentials'
  }
}

const handleSecret = async () => {
  try {
    const response = await api.post('/auth/verify', {
      userId: auth.user.user_id, 
      code: secretInput.value
    })

    if (response.status === 200) {
      auth.setVerified()
      const mapUrl = import.meta.env.VITE_MAP_SERVICE_URL
      if (mapUrl) {
        window.location.href = mapUrl
      } else {
        router.push('/')
      }
    }
  } catch (err) {
    statusMessage.value = 'Error: Invalid secret code'
  }
}

const logout = () => {
  auth.clearAuth()
  step.value = 1
  loginInput.value = ''
  passwordInput.value = ''
  secretInput.value = ''
  statusMessage.value = 'Logged out'
}
</script>

<template>
  <div class="terminal-container">
    <div class="box">
      <div v-if="step === 1">
        <h2>Who are you?</h2>
        <input v-model="loginInput" placeholder="LOGIN" />
        <input v-model="passwordInput" type="password" placeholder="PASSWORD" />
        <button class="btn-primary" @click="handleLogin">Access System</button>
      </div>

      <div v-if="step === 2">
        <h2>Verification</h2>
        <p class="user-info">AGENT: <span>{{ auth.user?.username || 'UNKNOWN' }}</span></p>
        <input v-model="secretInput" type="password" placeholder="SECRET CODE" />
        <div class="button-group">
          <button class="btn-primary" @click="handleSecret">Verify</button>
          <button class="btn-secondary" @click="logout">Abort</button>
        </div>
      </div>

      <p v-if="statusMessage" class="status-msg">{{ statusMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.terminal-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
}

.box {
  background: var(--bg-box);
  border: var(--border-main);
  padding: 40px;
  border-radius: 8px;
  width: 320px;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

h2 {
  color: var(--accent);
  margin-bottom: 25px;
}

button {
  width: 100%;
  margin-top: 15px;
}

.button-group {
  display: flex;
  flex-direction: column; 
  gap: 10px;
}

.user-info {
  font-size: 0.9rem;
  color: var(--text-dim);
  margin-bottom: 15px;
  letter-spacing: 1px;
}

.user-info span {
  color: var(--accent);
  font-weight: bold;
}

.status-msg {
  color: var(--danger);
  margin-top: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--accent);
  color: white;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>