import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    isLoggedIn: false
  }),

  actions: {
    setToken(token) {
      try {
        this.token = token
        // this.user = jwtDecode(token)
        this.isLoggedIn = true
      } catch (error) {
        console.error("JWT Decode Error:", error)
        this.clearAuth()
      }
    },

    setVerified(status = true) {
      this.isLoggedIn = status
    },

    clearAuth() {
      this.token = null
      this.user = null
      this.isLoggedIn = false

      const loginUrl = import.meta.env.VITE_LOGIN_SERVICE_URL
      if (loginUrl && window.location.port !== '5100') {
        window.location.href = loginUrl
      }
    }
  },
  persist: true
})
