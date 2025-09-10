import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/*', cors())

interface SlackChannel {
  id: string
  name: string
  is_channel: boolean
  is_archived: boolean
  is_member: boolean
}

interface SlackResponse {
  ok: boolean
  channels?: SlackChannel[]
  error?: string
  response_metadata?: {
    next_cursor?: string
  }
}

interface JoinResponse {
  ok: boolean
  channel?: {
    id: string
    name: string
  }
  error?: string
}

async function getAllChannels(token: string): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = []
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({
      limit: '1000',
      types: 'public_channel',
      exclude_archived: 'true',
    })

    if (cursor) {
      params.append('cursor', cursor)
    }

    const response = await fetch(`https://slack.com/api/conversations.list?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data: SlackResponse = await response.json()

    if (!data.ok) {
      throw new Error(`Failed to fetch channels: ${data.error}`)
    }

    if (data.channels) {
      channels.push(...data.channels)
    }

    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  return channels
}

async function joinChannel(token: string, channelId: string): Promise<JoinResponse> {
  const response = await fetch('https://slack.com/api/conversations.join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: channelId,
    }),
  })

  return response.json()
}

async function checkUserMembership(token: string, channelId: string, userId: string): Promise<boolean> {
  const response = await fetch(`https://slack.com/api/conversations.members?channel=${channelId}&limit=1000`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json()
  
  if (!data.ok) {
    return false
  }

  return data.members?.includes(userId) || false
}

app.post('/channels', async (c) => {
  try {
    const body = await c.req.json()
    const { token, pattern, matchType, userId, dryRun } = body

    if (!token || (!token.startsWith('xoxb-') && !token.startsWith('xoxp-'))) {
      return c.json({ error: 'Invalid token format' }, 400)
    }

    const channels = await getAllChannels(token)
    
    let targetChannels = channels
    
    if (pattern) {
      if (matchType === 'prefix') {
        targetChannels = channels.filter(ch => ch.name.startsWith(pattern))
      } else if (matchType === 'suffix') {
        targetChannels = channels.filter(ch => ch.name.endsWith(pattern))
      } else if (matchType === 'contains') {
        targetChannels = channels.filter(ch => ch.name.includes(pattern))
      } else if (matchType === 'regex') {
        const regex = new RegExp(pattern)
        targetChannels = channels.filter(ch => regex.test(ch.name))
      }
    }

    if (userId && userId.trim()) {
      const membershipChecks = await Promise.all(
        targetChannels.map(async (channel) => {
          const isMember = await checkUserMembership(token, channel.id, userId.trim())
          return { channel, isMember }
        })
      )
      targetChannels = membershipChecks
        .filter(({ isMember }) => isMember)
        .map(({ channel }) => channel)
    }

    targetChannels = targetChannels.filter(ch => !ch.is_member)

    if (dryRun) {
      return c.json({
        ok: true,
        channels: targetChannels.map(ch => ({
          id: ch.id,
          name: ch.name,
        })),
        count: targetChannels.length,
        dryRun: true,
      })
    }

    const results = []
    for (const channel of targetChannels) {
      try {
        const result = await joinChannel(token, channel.id)
        results.push({
          channel: channel.name,
          success: result.ok,
          error: result.error,
        })
      } catch (error) {
        results.push({
          channel: channel.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return c.json({
      ok: true,
      results,
      count: results.length,
    })

  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app