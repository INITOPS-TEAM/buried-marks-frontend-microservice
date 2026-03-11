<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api' //

const auth = useAuthStore()
const currentUser = computed(() => auth.user)

// Role verification for mailing access
const userRole = computed(() => Number(currentUser.value?.role || 0))
const isLocked = computed(() => userRole.value < 4)


const goToMap = () => {
  window.location.href = '/map/';
}

const inviteEmail = ref('')
const inviteError = ref('')

// Sending an invitation
const sendInvite = async () => {
  // Empty field - not performed
  if (!inviteEmail.value) return
  inviteError.value = ''

  try {
    //
    await api.post('/invite/', { email: inviteEmail.value })
    alert(`INVITATION EXECUTED: ${inviteEmail.value}`)
    inviteEmail.value = ''
  } catch (err) {
    if (err.response?.status === 400) {
      inviteError.value = "USER WITH THIS EMAIL ALREADY EXISTS IN SYSTEM"
    } else {
      inviteError.value = "COMMUNICATION ERROR: FAILED TO SEND INVITE"
    }
  }
}

// Email sending logic
const emailData = ref({
  subject: '',
  selectedRoles: [],
  custom_text: ''
})

const roleOptions = [
  { id: "1", label: 'USERS with ROLE 1', color: 'var(--base)' },
  { id: "2", label: 'USERS with ROLE 2', color: 'var(--scout)' },
  { id: "3", label: 'USERS with ROLE 3', color: 'var(--accent)' }
]

const toggleRole = (roleId) => {
  if (isLocked.value) return
  const index = emailData.value.selectedRoles.indexOf(roleId)
  // Add or remove a role
  if (index > -1) {
    emailData.value.selectedRoles.splice(index, 1)
  } else {
    emailData.value.selectedRoles.push(roleId)
  }
}

// Validation of role selection
const sendBroadcast = async () => {
  if (isLocked.value) return
  if (emailData.value.selectedRoles.length === 0) {
    alert("SELECT AT LEAST ONE TARGET ROLE")
    return
  }
  try {
    // Sending to the backend
    await api.post('/architect/send-email/', {
      subject: emailData.value.subject,
      custom_text: emailData.value.custom_text,
      roles: emailData.value.selectedRoles
    })
    alert("GLOBAL DISPATCH INITIATED")
    // Form cleaning
    emailData.value = { subject: '', selectedRoles: [], custom_text: '' }
  } catch (err) {
    alert("CRITICAL ERROR: BROADCAST FAILED")
  }
}
// Deleting application data
const wipeDatabase = () => {
  // Empty for now

  }

const renderStars = (num) => '★'.repeat(Number(num) || 0)

onMounted(() => {
  const role = Number(currentUser.value?.role)
  if (role < 3) {
    goToMap()
  }
})
</script>

<template>
  <div class="admin-view" v-if="currentUser">

    <header class="admin-header">
      <div class="header-info">
        <h1 class="glitch-text">ADMIN SECTOR</h1>

        <div class="status-bar-wrapper">
          <div class="agent-status-panel">
            <span class="label">AGENT:</span>
            <span class="value">{{ currentUser.username }}</span>

            <span class="separator">|</span>

            <span class="label">ROLE:</span>
            <span class="stars">{{ renderStars(currentUser.role) }}</span>

            <div v-if="currentUser.inspector" class="inspector-badge">
              INSPECTOR
            </div>
          </div>
        </div>
      </div>
      <button class="btn-secondary" @click="goToMap">RETURN TO MAP</button>
    </header>

    <div class="admin-container">

      <div class="layout-stack">
        <section class="content-block">
          <div class="section-title">AUTHORIZE ACCESS (INVITE)</div>
          <div class="card-body">
            <div class="input-group">
              <input
                v-model="inviteEmail"
                type="email"
                placeholder="RECRUIT_EMAIL@DOMAIN.COM"
                class="admin-input"
                :class="{ 'input-error': inviteError }"
                @keyup.enter="sendInvite"
              />
              <button class="btn-execute" @click="sendInvite">EXECUTE INVITE</button>
            </div>
            <p v-if="inviteError" class="error-msg">{{ inviteError }}</p>
          </div>
        </section>

        <section class="content-block danger-block">
          <div class="section-title color-danger">SYSTEM INTEGRITY</div>
          <div class="card-body">
            <button class="btn-mini-danger full-width" @click="wipeDatabase">DELETE SYSTEM</button>
          </div>
        </section>
      </div>

      <section class="content-block broadcast-block" :class="{ 'is-locked': isLocked }">
        <div class="section-title">
          ARCHITECT'S NOTIFICATION TERMINAL
          <span v-if="isLocked" class="lock-tag"> [LOCKED: REQUIRES ROLE 4]</span>
          <span v-else class="lock-tag active"> [ROLE 4 ACCESS GRANTED]</span>
        </div>

        <div class="card-body">
          <div class="role-selector">
            <p class="selector-label">TARGET CLASSIFICATIONS:</p>
            <div class="roles-grid">
              <button
                v-for="role in roleOptions" :key="role.id"
                class="role-btn"
                :class="{ 'active': emailData.selectedRoles.includes(role.id) }"
                @click="toggleRole(role.id)"
                :disabled="isLocked"
                :style="{ '--role-color': role.color }"
              >
                <span class="checkbox"></span> {{ role.label }}
              </button>
            </div>
          </div>

          <input
            v-model="emailData.subject"
            type="text"
            placeholder="SUBJECT"
            class="admin-input mb-20"
            :disabled="isLocked"
          />
          <textarea
            v-model="emailData.custom_text"
            placeholder="MESSAGE TEXT..."
            class="admin-textarea"
            :disabled="isLocked"
          ></textarea>

          <button
            class="btn-promo"
            :class="{ 'btn-disabled': isLocked }"
            @click="sendBroadcast"
            :disabled="isLocked"
          >
            {{ isLocked ? 'INSUFFICIENT ROLE PRIVILEGES' : 'INITIATE GLOBAL DISPATCH' }}
          </button>
        </div>

        <div v-if="isLocked" class="lock-overlay">
          <span class="lock-icon">🔒</span>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.admin-view {
  height: 100vh; overflow-y: scroll; padding: 20px; color: #aaa;
  font-family: var(--font-mono);
  background: linear-gradient(rgba(5, 5, 5, 0.85), rgba(5, 5, 5, 0.85));
}

/* Header Styles */
.admin-header { display: flex; justify-content: space-between; margin-bottom: 40px; border-left: 4px solid var(--accent); padding-left: 20px; }
.glitch-text { color: var(--accent); text-shadow: 0 0 15px rgba(53, 91, 218, 0.5); font-size: 1.5rem; letter-spacing: 4px; }
.agent-status-panel { display: flex; align-items: center; gap: 15px; margin-top: 12px; font-size: 0.9rem; color: #777; }
.agent-status-panel .value { color: #bbb; }
.stars { color: #ffcc00; letter-spacing: 3px; text-shadow: 0 0 8px rgba(255, 204, 0, 0.4); }
.inspector-badge { border: 1px solid var(--scout); color: var(--scout); padding: 2px 10px; font-size: 0.7rem; text-transform: uppercase; background: rgba(0, 255, 255, 0.05); }

/* Layout */
.admin-container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }
.layout-stack { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }

.content-block { background: rgba(15, 15, 15, 0.9); border: 1px solid rgba(53, 91, 218, 0.2); position: relative; }
.section-title { padding: 15px 20px; font-size: 0.9rem; background: rgba(53, 91, 218, 0.1); color: var(--accent); border-bottom: 1px solid rgba(53, 91, 218, 0.3); font-weight: bold; text-transform: uppercase; }
.card-body { padding: 25px; }

/* Broadcast Locked State */
.broadcast-block.is-locked { opacity: 0.9; filter: grayscale(0.5); }
.lock-tag { font-size: 0.7rem; margin-left: 15px; color: #666; }
.lock-tag.active { color: var(--accent); }
.lock-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 5; background: rgba(0,0,0,0.05); pointer-events: none; }
.lock-icon { font-size: 3rem; opacity: 0.15; }

/* Form Elements */
.admin-input, .admin-textarea {
  width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(53, 91, 218, 0.3); color: #fff;
  padding: 12px 15px; font-family: inherit; outline: none; transition: 0.3s;
}
.admin-input:disabled, .admin-textarea:disabled { cursor: not-allowed; border-color: #333; }
.admin-input:focus:not(:disabled) { border-color: var(--accent); box-shadow: 0 0 10px rgba(53, 91, 218, 0.2); }
.admin-textarea { min-height: 150px; resize: none; margin-bottom: 20px; }
.mb-20 { margin-bottom: 20px; }

/* Role Selector */
.role-selector { margin-bottom: 25px; }
.selector-label { font-size: 0.7rem; color: #555; margin-bottom: 10px; }
.roles-grid { display: flex; gap: 12px; }
.role-btn {
  background: rgba(0,0,0,0.3); border: 1px solid #333; color: #666; padding: 10px;
  cursor: pointer; font-family: inherit; font-size: 0.75rem; flex: 1; display: flex; align-items: center; gap: 10px;
}
.role-btn:disabled { cursor: not-allowed; }
.role-btn.active:not(:disabled) { border-color: var(--role-color); color: #fff; background: rgba(255,255,255,0.03); }
.checkbox { width: 10px; height: 10px; border: 1px solid #444; }
.role-btn.active .checkbox { background: var(--role-color); box-shadow: 0 0 5px var(--role-color); }

/* Buttons */
.btn-secondary { background: transparent; border: 1px solid #444; color: #888; padding: 8px 15px; cursor: pointer; transition: 0.3s; font-family: inherit; }
.btn-secondary:hover { border-color: #fff; color: #fff; }
.input-group { display: flex; gap: 10px; }
.btn-execute { background: var(--accent); color: #fff; border: none; padding: 0 25px; cursor: pointer; font-weight: bold; }
.btn-mini-danger { background: rgba(231, 76, 60, 0.1); border: 1px solid var(--danger); color: var(--danger); padding: 12px; cursor: pointer; font-weight: bold; }
.btn-mini-danger:hover { background: var(--danger); color: #000; }
.btn-promo { width: 100%; padding: 15px; background: var(--accent); color: #fff; border: none; cursor: pointer; font-weight: bold; text-transform: uppercase; }
.btn-promo.btn-disabled { background: #222 !important; color: #555 !important; box-shadow: none !important; cursor: not-allowed; }
.full-width { width: 100%; }

.color-danger { color: var(--danger) !important; background: rgba(231, 76, 60, 0.1); }
.error-msg { color: var(--danger); font-size: 0.75rem; margin-top: 10px; font-weight: bold; }
</style>
