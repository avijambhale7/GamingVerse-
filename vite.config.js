import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run dev` doesn't run Vercel's /api functions. This serves
// /api/trailer locally with the same handler, so trailers work in dev.
// (send-push still needs Vercel: it uses server-only secrets.)
function devTrailerApi() {
  return {
    name: 'dev-trailer-api',
    configureServer(server) {
      server.middlewares.use('/api/trailer', async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule('/api/trailer.js')
          const url = new URL(req.url, 'http://localhost')
          req.query = Object.fromEntries(url.searchParams)
          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (body) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
            return res
          }
          await handler(req, res)
        } catch (error) {
          console.error('dev /api/trailer failed:', error)
          res.statusCode = 500
          res.end('{"error":"dev trailer api failed"}')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devTrailerApi()],
  test: {
    // Pure-function unit tests only — no DOM rendering, so the default
    // node environment is enough and keeps the suite fast.
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
