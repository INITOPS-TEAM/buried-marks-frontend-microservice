import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = defineStore('auth', {
  state: () => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }

    const accessToken = getCookie('access_token');
    const refreshToken = getCookie('refresh_token');

    return {
      token: accessToken,
      refreshToken: refreshToken,
      user: accessToken ? jwtDecode(accessToken) : null,
      isLoggedIn: Boolean(accessToken)
    }
  },

  actions: {
    setToken(access, refresh) {
      try {
        this.token = access;
        this.refreshToken = refresh;
        this.user = jwtDecode(access);
        this.isLoggedIn = true;

        document.cookie = `access_token=${access}; path=/; max-age=300; SameSite=Lax`;
        if (refresh) {
          document.cookie = `refresh_token=${refresh}; path=/; max-age=86400; SameSite=Lax`;
        }
      } catch (error) {
        console.error("JWT Decode Error:", error);
        this.clearAuth();
      }
    },

    setVerified(status = true) {
      this.isLoggedIn = status;
    },

    clearAuth() {
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      this.isLoggedIn = false;
      
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 2000 00:00:00 UTC;";
      document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 2000 00:00:00 UTC;";

      const loginUrl = import.meta.env.VITE_LOGIN_SERVICE_URL;
      if (loginUrl && window.location.port !== '5100') {
        window.location.href = loginUrl;
      }
    }
  },
  persist: false
})