import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** Vite prebundles the SDK, so the LiveKit frame-metadata worker URL 404s and drops the video. */
function disableFrameMetadataWorker(code) {
  const marker = 'function isFrameMetadataRuntimeSupported()'
  const start = code.indexOf(marker)
  if (start < 0) return code
  const brace = code.indexOf('{', start)
  let depth = 0
  let end = brace
  for (; end < code.length; end++) {
    if (code[end] === '{') depth++
    else if (code[end] === '}') {
      depth--
      if (depth === 0) {
        end++
        break
      }
    }
  }
  return `${code.slice(0, brace)}{ return false }${code.slice(end)}`
}

function decartTokenPlugin(apiKey) {
  return {
    name: 'decart-tryon-token',
    configureServer(server) {
      server.middlewares.use('/api/tryon/token', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        if (!apiKey) {
          res.statusCode = 503
          res.end(JSON.stringify({
            error: 'DECART_API_KEY missing. Add it to Frontend/.env or catalog-service.',
          }))
          return
        }
        try {
          const decartRes = await fetch('https://api.decart.ai/v1/client/tokens', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expiresIn: 600 }),
          })
          const text = await decartRes.text()
          res.statusCode = decartRes.status
          if (!decartRes.ok) {
            res.end(JSON.stringify({ error: text || `Decart ${decartRes.status}` }))
            return
          }
          const data = JSON.parse(text)
          res.end(JSON.stringify({
            apiKey: data.apiKey,
            expiresAt: data.expiresAt,
            sessionSeconds: 45,
          }))
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: err.message || 'Decart token failed' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      decartTokenPlugin(env.DECART_API_KEY),
      {
        name: 'disable-decart-frame-metadata',
        enforce: 'pre',
        transform(code, id) {
          if (!id.includes('frame-metadata-diagnostics')) return null
          const next = disableFrameMetadataWorker(code)
          return next === code ? null : next
        },
      },
    ],
    resolve: {
      alias: [
        {
          find: /frame-metadata-diagnostics(?:\.js)?$/,
          replacement: fileURLToPath(new URL('./src/decart/frameMetadataStub.js', import.meta.url)),
        },
      ],
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: 'disable-decart-frame-metadata',
            setup(build) {
              build.onLoad({ filter: /frame-metadata-diagnostics\.js$/ }, async (args) => ({
                contents: disableFrameMetadataWorker(await fs.readFile(args.path, 'utf8')),
                loader: 'js',
              }))
            },
          },
        ],
      },
    },
    server: {
      port: 3001,
    },
  }
})
