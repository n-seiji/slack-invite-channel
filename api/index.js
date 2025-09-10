import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import app from '../app/server.ts'

export const config = {
  runtime: 'edge',
}

export default handle(app)