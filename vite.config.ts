import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/thai-accounting-erp-executive-prototype/' : '/',
  plugins: [react()],
})
