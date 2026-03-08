import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/voting/',
  server: {
    port: 5400,
    strictPort: true
  }
})