import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Pure-function unit tests only — no DOM rendering, so the default
    // node environment is enough and keeps the suite fast.
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
