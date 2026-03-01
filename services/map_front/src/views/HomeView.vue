<script setup>
import { ref, onMounted, onUnmounted, computed, markRaw } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const auth = useAuthStore()
const mapContainer = ref(null)
const markersList = ref([])
const activeGroups = ref({ danger: true, scout: true, base: true })

const showForm = ref(false)
const formPos = ref({ x: 0, y: 0 })
const tempCoords = ref({ lng: 0, lat: 0 })
const newMarkerData = ref({ label: '', category: 'scout' })

let mapInstance = null
const mapboxMarkers = markRaw(new Map())

const currentUser = computed(() => auth.user)

const permissions = computed(() => {
  const user = currentUser.value
  if (!user) return {}
  const level = Number(user.role)
  const isInspector = user.inspector === true
  return {
    isInspector,
    showAdmin: level === 3,
    canAdd:    level >= 2,
    canDelete: level === 3
  }
})

const renderStars = (num) => '★'.repeat(Number(num) || 0)

const groupedMarkers = computed(() => {
  const result = { danger: [], scout: [], base: [] }
  markersList.value.forEach(m => {
    if (result[m.category]) result[m.category].push(m)
  })
  return result
})

const handleLogout = () => {
  auth.clearAuth()
}

const goToAdmin = () => {
  window.location.href = import.meta.env.VITE_ADMIN_SERVICE_URL
}

const goToVoting = () => {
  window.location.href = import.meta.env.VITE_VOTING_SERVICE_URL
}

const goTo = (lng, lat, zoom = 14) => {
  mapInstance.flyTo({ center: [lng, lat], zoom })
}

const deleteMarker = async (id) => {
  if (!confirm('CONFIRM DELETION?')) return
  try {
    await api.delete(`api/markers/${id}/`)
    markersList.value = markersList.value.filter(m => m.id !== id)
    mapboxMarkers.get(id)?.remove()
    mapboxMarkers.delete(id)
  } catch (err) {
    console.error('Delete failed', err)
  }
}

const toggleConfirm = async (marker) => {
  try{
    if (marker.confirmed_by_me){
      await api.delete(`api/markers/${marker.id}/confirm/`)
      marker.confirm_count--
      marker.confirmed_by_me = false
    } else {
      await api.post(`api/markers/${marker.id}/confirm/`)
      marker.confirm_count++
      marker.confirmed_by_me = true
    }
  } catch (err) {
      console.error('Confirm failed', err)
  }
}

window.confirmMarker = (id) => {
  const marker = markersList.value.find(m => m.id === id)
  if (marker) {
    toggleConfirm(marker).then(() => {
      const countEl = document.getElementById(`confirm-count-${id}`)
      if (countEl) countEl.textContent = marker.confirm_count
    })
  }
}

window.deleteMarkerById = async (id) => {
  await deleteMarker(id)
}

const saveMarker = async () => {
  if (!newMarkerData.value.label) return
  try {
    const { data } = await api.post('api/markers/', {
      ...newMarkerData.value,
      ...tempCoords.value,
      author_id: currentUser.value?.user_id
    })
    markersList.value.push(data)
    addMarkerToMap(data)
    showForm.value = false
    newMarkerData.value.label = ''
  } catch (err) {
    console.error('Save failed', err)
  }
}

const addMarkerToMap = (m) => {
  const el = document.createElement('div')
  el.className = `marker ${m.category}`

  const popupHTML = `
    <div class="popup-content">
      <div class="popup-title" style="color: ${m.category === 'danger' ? 'var(--danger)' : m.category === 'scout' ? 'var(--scout)' : 'var(--base)'}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-size: 0.85 rem; ">
        ${m.label}
      </div>
      <div class="popup-actions" style="display: flex; gap: 6px;">
        <button class="btn-secondary"
          onclick="window.confirmMarker(${m.id})"
          ${m.author_id === currentUser.value?.user_id ? 'disabled' : ''}>
        ✓ <span id="confirm-count-${m.id}">${m.confirm_count}</span>
        </button>
        ${permissions.value.canDelete ? `<button onclick="window.deleteMarkerById(${m.id})">×</button>` : ''}
        </div>
      </div>
  `

  const marker = new mapboxgl.Marker(el)
    .setLngLat([m.lng, m.lat])
    .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML))
    .addTo(mapInstance)
  mapboxMarkers.set(m.id, marker)
}

onMounted(async () => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

  mapInstance = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/alexkorol10/cmlutt15o003j01qv0b4u4rju',
    center: [30.5234, 50.4501],
    zoom: 10,
    attributionControl: false
  })

  mapInstance.on('contextmenu', (e) => {
    if (!permissions.value.canAdd) return
    formPos.value = { x: e.point.x, y: e.point.y }
    tempCoords.value = { lng: e.lngLat.lng, lat: e.lngLat.lat }
    showForm.value = true
  })

  mapInstance.on('click', () => showForm.value = false)

  try {
    const { data } = await api.get('api/markers/')
    markersList.value = data
    data.forEach(addMarkerToMap)
  } catch (err) {
    console.error('Load markers failed', err)
  }
})

onUnmounted(() => {
  if (mapInstance) mapInstance.remove()
})
</script>

<template>
  <div class="home-container" v-if="currentUser">
    <header class="hud">
      <div class="hud-content">
        <div class="status-left">
          <h1 class="main-title">MAP SECTOR: ACTIVE</h1>
          <div class="agent-info">
            <span>AGENT: {{ currentUser.username }}</span>
            <span class="sep">|</span>
            <span>ROLE: <span class="stars">{{ renderStars(currentUser.role) }}</span></span>
            <span v-if="permissions.isInspector" class="role-badge">INSPECTOR</span>
          </div>
        </div>
        <div class="nav-right">
          <button v-if="permissions.isInspector" class="btn-primary voting-glow" @click="goToVoting">VOTING</button>
          <button v-if="permissions.showAdmin" class="btn-primary" @click="goToAdmin">ADMIN</button>
          <button class="btn-secondary" @click="handleLogout">LOGOUT</button>
        </div>
      </div>
    </header>

    <main class="content">
      <aside class="sidebar">
        <div v-for="(items, category) in groupedMarkers" :key="category">
          <div class="group-header" @click="activeGroups[category] = !activeGroups[category]">
            <span>{{ category.toUpperCase() }} ({{ items.length }})</span>
            <span>{{ activeGroups[category] ? '▼' : '▶' }}</span>
          </div>
          <div v-if="activeGroups[category]">
            <div v-for="m in items" :key="m.id" class="item">
              <div class="item-info" @click="goTo(m.lng, m.lat)">
                <span class="dot" :class="m.category"></span>
                <span>{{ m.label }}</span>
              </div>
              <button
                class="confirm-btn"
                :class="[{ confirmed: m.confirmed_by_me }, m.category]"
                :disabled="m.author_id === currentUser.user_id"
                @click.stop="toggleConfirm(m)"
                >
                ✓ {{ m.confirm_count }}
              </button>
              <button v-if="permissions.canDelete" class="delete-icon" @click.stop="deleteMarker(m.id)">×</button>
            </div>
          </div>
        </div>
      </aside>

      <div class="map-area">
        <div ref="mapContainer" class="map-box"></div>

        <div v-if="showForm" class="marker-form" :style="{ top: formPos.y + 'px', left: formPos.x + 'px' }">
          <div class="form-title">NEW DEPLOYMENT</div>
          <input v-model="newMarkerData.label" placeholder="OBJECT NAME" @keyup.enter="saveMarker" autofocus />
          <select v-model="newMarkerData.category">
            <option value="scout">SCOUT</option>
            <option value="danger">DANGER</option>
            <option value="base">BASE</option>
          </select>
          <div class="form-btns">
            <button class="btn-primary" @click="saveMarker">DEPLOY</button>
            <button class="btn-secondary" @click="showForm = false">×</button>
          </div>
        </div>

        <button class="center-btn" @click="goTo(30.5234, 50.4501, 10)">⌖</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-container { height: 100vh; display: flex; flex-direction: column; background: #000; }
.content { flex: 1; display: flex; overflow: hidden; }
.hud { background: var(--bg-panel); border-bottom: 1px solid var(--accent); padding: 0 25px; min-height: 80px; display: flex; align-items: center; backdrop-filter: blur(5px); }
.hud-content { width: 100%; display: flex; justify-content: space-between; align-items: center; }
.nav-right { display: flex; gap: 15px; }
.main-title { color: var(--accent); font-size: 1.3rem; margin: 0; letter-spacing: 2px; }
.agent-info { font-size: 0.8rem; display: flex; gap: 15px; align-items: center; color: #aaa; margin-top: 5px; }
.stars { color: var(--stars); letter-spacing: 2px; }
.role-badge { border: 1px solid var(--scout); color: var(--scout); padding: 2px 8px; font-size: 0.7rem; text-transform: uppercase; }
.sep { opacity: 0.3; }
.sidebar { width: 280px; border-right: 1px solid var(--accent-hover2); background: var(--bg-panel); overflow-y: auto; }
.group-header { padding: 12px 15px; background: rgba(0,0,0,0.3); cursor: pointer; display: flex; justify-content: space-between; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
.item { padding: 8px 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.02); }
.item-actions { display: flex; gap: 8px; align-items: center;}
.item:hover { background: rgba(23, 27, 107, 0.2); }
.item-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.map-area { flex: 1; position: relative; }
.map-box { position: absolute; inset: 0; }
.marker-form { position: absolute; background: var(--bg-box); border: 1px solid var(--accent); padding: 15px; width: 200px; z-index: 1000; box-shadow: 0 10px 30px #000; }
.form-title { font-size: 0.7rem; color: var(--accent); margin-bottom: 10px; font-weight: bold; }
.marker-form input, .marker-form select { width: 100%; background: #000; border: 1px solid var(--accent-hover2); color: #fff; padding: 8px; margin-bottom: 10px; font-family: var(--font-mono); }
.form-btns { display: flex; gap: 8px; }
.form-btns button { flex: 1; height: 32px; font-size: 0.7rem; }
.center-btn { position: absolute; top: 20px; right: 20px; background: var(--bg-box); border: 1px solid var(--accent); color: var(--scout); width: 45px; height: 45px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.confirm-btn { background: none; border: 1px solid var (--accent-hover2); color: var(--test-dim); cursor: pointer; font-family: var(--font-mono); font-size: 0.75rem; padding: 2px 8px; transition: 0.2s; }
.confirm-btn.confirmed.danger { border-color: var(--danger); color: var(--danger);}
.confirm-btn.confirmed.scout { border-color: var(--scout); color: var(--scout);}
.confirm-btn.confirmed.base { border-color: var(--base); color: var(--base);}
.confirm-btn:hover:not(:disabled) { border-color: var(--text-dim); color: var(--text-dim);}
.confirm-btn:disabled { opacity: 0.3; cursor: not-allowed;}
.delete-icon { background: none; border: none; color: #555; cursor: pointer; font-size: 1.2rem; transition: 0.2s; }
.delete-icon:hover { color: var(--danger); }
.voting-glow { box-shadow: 0 0 10px rgba(66, 133, 244, 0.4); border-color: #4285f4; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.danger { background: var(--danger); box-shadow: 0 0 5px var(--danger); }
.dot.scout { background: var(--scout); box-shadow: 0 0 5px var(--scout); }
.dot.base { background: var(--base); box-shadow: 0 0 5px var(--base); }
:deep(.marker) { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; cursor: pointer; }
:deep(.marker.danger) { background: var(--danger); }
:deep(.marker.scout) { background: var(--scout); }
:deep(.marker.base) { background: var(--base); }
</style>
