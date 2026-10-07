import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run dev` doesn't run Vercel's /api functions. This serves
// /api/trailer, /api/rawg and /api/resolve-username with the same
// handlers, so they work in dev too. resolve-username (username login)
// needs FIREBASE_SERVICE_ACCOUNT in .env.local; without it, username
// login answers "invalid" in dev and email login still works.
// (send-push still needs Vercel.)
const DEV_APIS = ['trailer', 'rawg', 'resolve-username', 'health']

// Vercel parses JSON request bodies; do the same for the dev server.
function readJsonBody(req) {
  if (req.method !== 'POST') return Promise.resolve(undefined)
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1e5) req.destroy()
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

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
            req.body = await readJsonBody(req)
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
  if (env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT) {
    process.env.FIREBASE_SERVICE_ACCOUNT = env.FIREBASE_SERVICE_ACCOUNT
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
