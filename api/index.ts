import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const app = new Hono().basePath('/api')

// Enable CORS manually
app.use('/*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204)
  }
  
  await next()
})

// Slack API proxy endpoint
app.all('/slack/*', async (c) => {
  const path = c.req.path.replace('/api/slack/', '')
  const url = `https://slack.com/api/${path}`
  
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'No token provided' }, 401)
  }

  try {
    const response = await fetch(url, {
      method: c.req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: c.req.method !== 'GET' ? await c.req.text() : undefined,
    })

    const data = await response.json()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to proxy request', details: error.message }, 500)
  }
})

export default handle(app)