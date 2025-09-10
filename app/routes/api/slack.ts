import { Hono } from 'hono'

const app = new Hono()

// Slack API proxy endpoint
app.all('/*', async (c) => {
  const path = c.req.path.replace('/api/slack/', '')
  const url = `https://slack.com/api/${path}`
  
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'No token provided' }, 401)
  }

  try {
    const body = c.req.method !== 'GET' ? await c.req.text() : undefined
    
    const response = await fetch(url, {
      method: c.req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body,
    })

    const data = await response.json()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to proxy request', details: error instanceof Error ? error.message : String(error) }, 500)
  }
})

export default app