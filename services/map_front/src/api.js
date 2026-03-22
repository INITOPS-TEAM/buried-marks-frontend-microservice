import axios from 'axios'
import { useAuthStore } from './stores/auth'

const api = axios.create({
  baseURL: ''
})
api.interceptors.request.use(config => {
  const auth = useAuthStore()
  const token = auth.token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const auth = useAuthStore()

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = auth.refreshToken

        if (!refreshToken) {
          auth.clearAuth()
          return Promise.reject(error)
        }

        const response = await axios.post('/api/token/refresh/', {
          refresh: refreshToken
        })

        const newAccessToken = response.data.access
        auth.updateAccessToken(newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return api(originalRequest)

      } catch (refreshError) {
        console.error('Session expired. Please log in again.', refreshError)
        auth.clearAuth()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
