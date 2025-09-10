import honox from 'honox/vite'
import adapter from '@hono/vite-dev-server/node'
import build from '@hono/vite-build/node'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    honox(),
    build()
  ]
})