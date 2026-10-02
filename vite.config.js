import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run dev` doesn't run Vercel's /api functions. This serves the
// ones that need no secrets beyond .env.local — /api/trailer and
// /api/rawg — with the same handlers, so they work in dev too.
// (send-push still needs Vercel: it uses the Firebase service account.)
const DEV_APIS = ['trailer', 'rawg']

function devApis() {
  return {
    name: 'dev-api-functions',
    configureServer(server) {
      DEV_APIS.forEach((name) => {
        server.middlewares.use(`/api/${name}`, async (req, res) => {
          try {
            const { default: handler } = await server.ssrLoadModule(`/api/${name}.js`)
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
            res.send = (body) => {
              res.end(body)
              return res
            }
            await handler(req, res)
          } catch (error) {
            console.error(`dev /api/${name} failed:`, error)
            res.statusCode = 500
            res.end(`{"error":"dev ${name} api failed"}`)
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Give the dev API functions the RAWG key from .env.local (server side
  // only — the browser code never reads it).
  const env = loadEnv(mode, process.cwd(), '')
  if (env.VITE_RAWG_API_KEY && !process.env.VITE_RAWG_API_KEY) {
    process.env.VITE_RAWG_API_KEY = env.VITE_RAWG_API_KEY
  }

  return {
    plugins: [react(), devApis()],
    test: {
      // Pure-function unit tests only — no DOM rendering, so the default
      // node environment is enough and keeps the suite fast.
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  }
})
