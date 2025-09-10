import { handle } from 'hono/vercel'

export const config = {
  runtime: 'edge',
}

const { default: app } = await import('../dist/index.js')

export default handle(app)