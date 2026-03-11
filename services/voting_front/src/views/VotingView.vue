<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const auth = useAuthStore()
const activePolls = ref([])
const archivedPolls = ref([])
const users = ref([])
const searchQuery = ref('')
const notifications = ref([])

// Notification
const notify = (message, type = 'info') => {
  const id = Date.now()
  notifications.value.push({ id, message, type })
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 3000)
}

const currentUser = computed(() => auth.user)
const isInspector = computed(() => currentUser.value?.inspector === true)

const goToMap = () => {
  window.location.href = '/map/';
};

// self-nomination rights
const canLevelUp = computed(() => currentUser.value?.role === '1')
const canLevelTop = computed(() => currentUser.value?.role === '2')

// filter for the ban table
const filteredUsers = computed(() => {
  return users.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// requests to the backend
const fetchData = async () => {
  try {
    const [pollsRes, usersRes] = await Promise.all([
      api.get('/api/polls/'),
      api.get('/api/users/').catch(() => ({ data: [] }))
    ])

    // check if the database does not send an array
    const allPolls = Array.isArray(pollsRes.data) ? pollsRes.data : (pollsRes.data?.polls || [])

    // active voting results
    const activeRaw = allPolls.filter(p => p.status === 'active')
    activePolls.value = await Promise.all(activeRaw.map(async (p) => {
      try {
        const res = await api.get(`/api/polls/${p.id}/result`)
      return {
        ...p,
        ...res.data,
      voted_users: p.voted_users || res.data.voted_users || []
    }
    } catch { return p }
}))

// completed voting results
    const completed = allPolls.filter(p => p.status !== 'active')
    archivedPolls.value = await Promise.all(completed.map(async (p) => {
      try {
        const res = await api.get(`/api/polls/${p.id}/result`)
        return {
          ...p,
          ...res.data,
          voted_users: p.voted_users || res.data.voted_users || []
        }
      } catch { return p }
    }))

    users.value = usersRes.data
  } catch (err) {
    console.error(err)
    notify('SYSTEM ERROR: DATA STREAM INTERRUPTED', 'danger')
  }
}

// Saving the ID of voted user polls
const localVotes = ref([])

// CONFIRM / REJECT
const castVote = async (pollId, choice) => {
  try {
    await api.post(`/api/polls/${pollId}/vote`, { choice })
    notify(`PROTOCOL VOTE [${choice.toUpperCase()}] REGISTERED`)
    localVotes.value.push(pollId)
    // After the vote, we update the data so that the buttons disappear
    await fetchData()
  } catch (err) {
    const status = err.response?.status

    // 409 (Conflict) та 403 (Forbidden)
    if (status === 409) {
      notify('ALREADY VOTED', 'warning')
      localVotes.value.push(pollId)
      await fetchData()
    }
    else if (status === 403) {
    notify('ACCESS DENIED: INSUFFICIENT ROLE', 'danger')
    }
    else {
    notify('VOTE ERROR: ' + (err.response?.data?.detail || 'SERVER ERROR'), 'danger')
    console.error('Vote error detail:', err.response?.data)
  }
}
}
// Vote for ban
const initiateBan = async (user) => {
  if (!isInspector.value) return
  try {
    await api.post('/api/polls/', {
      type: 'ban',
      target_id: user.user_id
    })
    notify(`INITIATING BAN PROTOCOL: ${user.username.toUpperCase()}`, 'danger')
    await fetchData()
  } catch (err) {
    notify('SYSTEM ERROR: BAN PROTOCOL FAILED', 'danger')
  }
}
// Self-nomination
const initiateSelfPromotion = async (type) => {
  try {
    await api.post('/api/polls/', {
      type: type,
      target_id: currentUser.value.user_id
    })
    const typeLabel = type === 'level_up' ? 'LEVEL UP' : 'LEVEL TOP'
    notify(`PROMOTION PROTOCOL [${typeLabel}] INITIATED`, 'info')
    await fetchData()
  } catch (err) {
    notify('SYSTEM ERROR: PROMOTION FAILED', 'danger')
  }
}

// Details for closed voting
const getPollDetails = (poll) => {
  if (poll.type === 'level_up') return poll.success ? 'Level increased to 2' : 'Promotion rejected'
  if (poll.type === 'level_top') return poll.success ? 'Elevation to TOP tier completed' : 'Top clearance rejected'
  if (poll.type === 'ban') return poll.success ? 'Access revoked. User neutralized' : 'Sanctions rejected'
  return 'Protocol finalized'
}

onMounted(fetchData)
</script>

<template>
  <div class="voting-view admin-view" v-if="currentUser">

    <div class="notification-container">
      <TransitionGroup name="toast">
        <div v-for="n in notifications" :key="n.id" class="toast" :class="n.type">
          <div class="toast-content"><span class="blink">●</span> {{ n.message }}</div>
          <div class="toast-progress"></div>
        </div>
      </TransitionGroup>
    </div>

    <header class="admin-header">
      <div class="header-info">
        <h1 class="glitch-text">VOTING SYSTEM</h1>
        <div class="status-bar-wrapper">
          <div class="agent-status-panel">
            <span class="label">AGENT:</span>
            <span class="value">{{ currentUser.username }}</span>
            <span class="separator">|</span>
            <span class="label">ROLE:</span>
            <span class="stars">{{ '★'.repeat(currentUser.role) }}</span>
            <div v-if="isInspector" class="inspector-badge">INSPECTOR</div>
          </div>
        </div>
      </div>
      <button class="btn-secondary" @click="goToMap">RETURN TO MAP</button>
    </header>

    <div class="layout-stack">
      <section v-if="canLevelUp || canLevelTop" class="content-block promotion-card">
        <div class="section-title">CHANGE OF LEVEL IN THE SYSTEM</div>
        <div class="promotion-controls">
          <p class="protocol-text">
            You have the right to request an access level increase. This will initiate a voting process.
          </p>
          <button v-if="canLevelUp" class="btn-promo level_up" @click="initiateSelfPromotion('level_up')">
            INITIATE LEVEL UP PROTOCOL
          </button>
          <button v-if="canLevelTop" class="btn-promo level_top" @click="initiateSelfPromotion('level_top')">
            INITIATE LEVEL TOP PROTOCOL
          </button>
        </div>
      </section>

      <section v-if="isInspector" class="content-block">
        <div class="section-title">LIST OF ACTIVE AGENTS</div>
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="FILTER BY IDENTIFIER..." class="admin-input" />
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>IDENTIFIER</th>
                <th>ROLE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.user_id" :class="{ 'is-me': user.user_id === currentUser.user_id }">
                <td>{{ user.username }}</td>
                <td class="stars">{{ '★'.repeat(user.role) }}</td>
                <td>
                  <button v-if="isInspector && user.user_id !== currentUser.user_id"
                          class="btn-mini-danger" @click="initiateBan(user)">
                    INITIATE BAN
                  </button>
                  <span v-else-if="user.user_id === currentUser.user_id" class="you-label">YOU</span>
                  <span v-else class="locked-status">PROTECTED</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="content-block">
        <div class="section-title">ACTIVE POLLS</div>
        <div class="polls-list">
          <div v-for="poll in activePolls" :key="poll.id" class="poll-item">
            <div class="poll-info">
              <span class="type-tag" :class="poll.type">{{ poll.type?.toUpperCase() }}</span>
              <span class="target">TARGET: {{ poll.target_id }}</span>
              <div class="live-score" style="margin-left: 20px; font-size: 0.8rem; letter-spacing: 1px;">
                <span style="color: var(--base)">FOR: {{ poll.votes_for || 0 }}</span>
                <span style="margin: 0 10px; color: #444;">|</span>
                <span style="color: var(--danger)">AGST: {{ poll.votes_against || 0 }}</span>
              </div>
            </div>
            <div class="poll-controls">
              <template v-if="!poll.voted_users?.includes(currentUser.user_id) && !localVotes.includes(poll.id)">
                <button class="btn-vote for" @click="castVote(poll.id, 'for')">CONFIRM</button>
                <button class="btn-vote against" @click="castVote(poll.id, 'against')">REJECT</button>
              </template>
              <div v-else class="voted-status" style="color: var(--accent); font-size: 0.8rem; font-style: italic; opacity: 0.7;">
               // PROTOCOL VOTED
              </div>
            </div>
          </div> <div v-if="activePolls.length === 0" class="empty-msg" style="margin: 24px;">NO ACTIVE PROTOCOLS</div>
        </div> </section>

      <section class="content-block archive-block">
        <div class="section-title">COMPLETED POLLS</div>
        <div class="polls-list">
          <div v-for="poll in archivedPolls" :key="poll.id"
               class="poll-item archived"
               :class="{ 'success-border': poll.success, 'failed-border': !poll.success }">
            <div class="poll-info">
              <span class="type-tag" :class="poll.type">{{ poll.type?.toUpperCase() }}</span>
              <span class="target">ID: {{ poll.target_id }}</span>
              <span class="result-badge" :class="poll.success ? 'success' : 'failed'">
                {{ poll.success ? 'SUCCESS' : 'FAILED' }}
              </span>
            </div>
            <div class="poll-stats">
              <span class="stat-for">FOR: {{ poll.votes_for || 0 }}</span>
              <span class="stat-separator">/</span>
              <span class="stat-against">AGAINST: {{ poll.votes_against || 0 }}</span>
              <span class="details-text">// {{ getPollDetails(poll) }}</span>
            </div>
          </div> </div> </section>
    </div> </div> </template>

<style scoped>
/* BASE  */
.voting-view { height: 100vh; overflow-y: scroll; padding: 20px; color: #aaa; font-family: var(--font-mono); background: linear-gradient(rgba(5, 5, 5, 0.85), rgba(5, 5, 5, 0.85))}
.layout-stack { display: flex; flex-direction: column; gap: 50px; max-width: 1400px; margin: 0 auto; padding-bottom: 60px; }
.content-block { background: rgba(15, 15, 15, 0.9); border: 1px solid rgba(53, 91, 218, 0.2); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.section-title { padding: 15px 20px; font-size: 1.1rem; background: rgba(53, 91, 218, 0.1); color: var(--accent); border-bottom: 1px solid rgba(53, 91, 218, 0.3); letter-spacing: 2px; font-weight: bold; text-transform: uppercase; }

/* HEADER */
.admin-header { display: flex; justify-content: space-between; margin-bottom: 40px; border-left: 4px solid var(--accent); padding-left: 20px; }
.agent-status-panel { display: flex; align-items: center; gap: 15px; margin-top: 12px; font-size: 0.9rem; color: #777; }
.agent-status-panel .value { color: #bbb; }
.stars { color: #ffcc00; letter-spacing: 3px; text-shadow: 0 0 8px rgba(255, 204, 0, 0.4); }
.inspector-badge { margin-left: 10px; border: 1px solid var(--scout); color: var(--scout); padding: 2px 10px; font-size: 0.7rem; text-transform: uppercase; background: rgba(0, 255, 255, 0.05); }
.glitch-text { color: var(--accent); text-shadow: 0 0 15px rgba(53, 91, 218, 0.5); }

/* VOTING */
.poll-item { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid #222; }
.type-tag { font-size: 0.8rem; padding: 5px 15px; background: rgba(53, 91, 218, 0.1); border: 1px solid var(--accent); color: var(--accent); font-weight: bold; margin-right: 20px; min-width: 100px; text-align: center; }
.type-tag.ban { background: rgba(241, 17, 17, 0.1); border-color: var(--danger); color: var(--danger); }
.target { color: #666; text-transform: uppercase; font-weight: bold; }

.btn-vote { padding: 10px 35px; font-size: 0.85rem; font-weight: bold; border: 2px solid; cursor: pointer; transition: 0.3s; text-transform: uppercase; }
.btn-vote.for { background: rgba(0, 255, 102, 0.1); color: var(--base); border-color: var(--base); margin-right: 12px; }
.btn-vote.for:hover { background: var(--base); color: #000; box-shadow: 0 0 20px var(--base); }
.btn-vote.against { background: rgba(255, 68, 68, 0.1); color: var(--danger); border-color: var(--danger); }
.btn-vote.against:hover { background: var(--danger); color: #000; box-shadow: 0 0 20px var(--danger); }

/* CAREER */
.promotion-card { border: 1px solid var(--accent); background: rgba(53, 91, 218, 0.05); padding: 45px; text-align: center; }
.btn-promo { min-width: 320px; padding: 20px 45px; font-size: 1.1rem; background: var(--accent); color: #fff; border: none; cursor: pointer; box-shadow: 0 0 25px rgba(53, 91, 218, 0.4); font-weight: bold; text-transform: uppercase; }
.btn-promo:hover { filter: brightness(1.2); box-shadow: 0 0 40px rgba(53, 91, 218, 0.6); }

/* ARCHIVE */
.poll-item.archived { background: rgba(20, 20, 20, 0.5); border-left: 3px solid #444; }
.poll-item.archived.success-border { border-left-color: var(--base); }
.poll-item.archived.failed-border { border-left-color: var(--danger); }
.stat-for { color: var(--base); font-weight: bold; padding: 2px 8px; background: rgba(0, 255, 102, 0.1); margin-right: 10px; }
.stat-against { color: var(--danger); font-weight: bold; padding: 2px 8px; background: rgba(255, 68, 68, 0.1); }
.result-badge { padding: 6px 16px; font-size: 0.75rem; font-weight: 900; margin-left: 20px; text-transform: uppercase; }
.result-badge.success { background: var(--base); color: #000; }
.result-badge.failed { background: var(--danger); color: #000; }
.poll-info { display: flex; align-items: center; margin-bottom: 10px; }
.poll-stats { font-size: 0.9rem; color: #555; }

/* TABLE */
.admin-input { width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(53, 91, 218, 0.3); color: var(--accent); padding: 12px 15px; font-family: inherit; outline: none; font-size: 0.85rem; transition: 0.3s; margin: 15px 20px; width: calc(100% - 40px); }
.admin-input:focus { border-color: var(--accent); box-shadow: 0 0 10px rgba(53, 91, 218, 0.2); }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
table th { padding: 15px 25px; color: #666; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid rgba(53, 91, 218, 0.1); text-align: left; }
table td { padding: 15px 25px; border-bottom: 1px solid rgba(255, 255, 255, 0.03); color: #bbb; vertical-align: middle; }
table tr:hover td { background: rgba(53, 91, 218, 0.03); color: #fff; }
.btn-mini-danger { background: rgba(231, 76, 60, 0.05); border: 1px solid rgba(231, 76, 60, 0.4); color: #e74c3c; padding: 6px 15px; cursor: pointer; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; transition: 0.2s; }
.btn-mini-danger:hover { background: #e74c3c; color: #000; box-shadow: 0 0 10px rgba(231, 76, 60, 0.4); }
.you-label { color: var(--accent); font-size: 0.7rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }

/* TOASTS */
.notification-container { position: fixed; top: 30px; right: 30px; z-index: 9999; display: flex; flex-direction: column; gap: 12px; }
.toast { background: #000; border: 1px solid var(--accent); border-left: 10px solid var(--accent); color: #fff; padding: 20px 35px; font-size: 0.95rem; min-width: 400px; box-shadow: 0 0 30px rgba(53, 91, 218, 0.3); font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
.toast.danger { border-color: var(--danger); border-left-color: var(--danger); color: var(--danger); }
</style>
