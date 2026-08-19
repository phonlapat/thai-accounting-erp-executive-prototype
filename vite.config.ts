import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { PRODUCTION_CSP } from './scripts/security-policy.mjs'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/thai-accounting-erp-executive-prototype/' : '/',
  define: {
    __BUILD_AT__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    {
      name: 'production-security-policy',
      apply: 'build',
      transformIndexHtml: {
        order: 'pre',
        handler: () => [{
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: PRODUCTION_CSP },
          injectTo: 'head-prepend',
        }],
      },
    },
  ],
})
