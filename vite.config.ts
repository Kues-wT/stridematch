import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Allow cloud dev/preview sandboxes (e.g. Arena e2b previews) to load the dev server.
    allowedHosts: ['.e2b.app', 'localhost'],
  },
})
