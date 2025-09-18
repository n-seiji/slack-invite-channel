// Vercel Serverless Function handler for HonoX
import { handle } from 'hono/vercel'

// Dynamic import of the built server
let app

export default async function handler(req, res) {
  if (!app) {
    const serverModule = await import('../dist/server.js')
    app = serverModule.app || serverModule.default
  }

  // Use Hono's Vercel adapter
  return handle(app)(req, res)
}