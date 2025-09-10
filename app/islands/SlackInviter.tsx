import { useState } from 'hono/jsx'

interface Channel {
  id: string
  name: string
  is_member: boolean
  is_private: boolean
}

export default function SlackInviter() {
  const [token, setToken] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' | 'warning' } | null>(null)
  const [showChannels, setShowChannels] = useState(false)

  const fetchChannels = async () => {
    if (!token) {
      setMessage({ text: 'トークンを入力してください', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: 'チャンネル一覧を取得中...', type: 'info' })

    try {
      const response = await fetch('/api/slack/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.ok) {
        setChannels(data.channels || [])
        setShowChannels(true)
        setMessage({ text: `${data.channels?.length || 0}個のチャンネルを取得しました`, type: 'success' })
      } else {
        setMessage({ text: `エラー: ${data.error}`, type: 'error' })
      }
    } catch (error) {
      setMessage({ text: `エラー: ${error instanceof Error ? error.message : String(error)}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleChannelToggle = (channelId: string) => {
    const newSelected = new Set(selectedChannels)
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId)
    } else {
      newSelected.add(channelId)
    }
    setSelectedChannels(newSelected)
  }

  const inviteToChannels = async () => {
    if (selectedChannels.size === 0) {
      setMessage({ text: 'チャンネルを選択してください', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: `${selectedChannels.size}個のチャンネルに参加中...`, type: 'info' })
    
    const isUserToken = token.startsWith('xoxp-')
    const results = []
    
    for (const channelId of selectedChannels) {
      try {
        const endpoint = isUserToken ? 'conversations.join' : 'conversations.invite'
        const body = isUserToken 
          ? { channel: channelId }
          : { channel: channelId, users: 'U_YOUR_USER_ID' } // Bot tokenの場合はユーザーIDが必要

        const response = await fetch(`/api/slack/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        const data = await response.json()
        results.push({ channelId, success: data.ok, error: data.error })
      } catch (error) {
        results.push({ channelId, success: false, error: error instanceof Error ? error.message : String(error) })
      }
    }

    const successCount = results.filter(r => r.success).length
    setMessage({ 
      text: `${successCount}/${results.length}個のチャンネルへの参加が完了しました`, 
      type: successCount === results.length ? 'success' : 'warning' 
    })
    
    // Reset selection
    setSelectedChannels(new Set())
    setLoading(false)
  }

  const getMessageClass = () => {
    if (!message) return ''
    const baseClass = 'mt-4 text-center p-3 rounded'
    switch (message.type) {
      case 'error': return `${baseClass} bg-red-100 text-red-700`
      case 'success': return `${baseClass} bg-green-100 text-green-700`
      case 'warning': return `${baseClass} bg-yellow-100 text-yellow-700`
      default: return `${baseClass} bg-blue-100 text-blue-700`
    }
  }

  return (
    <div>
      <div class="mb-6">
        <label for="token" class="block text-sm font-medium text-gray-700 mb-2">
          Slack Token (Bot Token xoxb- or User Token xoxp-)
        </label>
        <input
          type="password"
          id="token"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="xoxb-... または xoxp-..."
          value={token}
          onInput={(e) => setToken((e.target as HTMLInputElement).value)}
          disabled={loading}
        />
      </div>

      <button
        class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors mb-6 disabled:bg-gray-400"
        onClick={fetchChannels}
        disabled={loading}
      >
        {loading && !showChannels ? 'チャンネル一覧を取得中...' : 'チャンネル一覧を取得'}
      </button>

      {showChannels && (
        <div>
          <h2 class="text-xl font-semibold mb-4">チャンネルを選択</h2>
          <div class="space-y-2 mb-6 max-h-96 overflow-y-auto">
            {channels.map(channel => (
              <div key={channel.id} class="flex items-center p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  id={channel.id}
                  class="mr-3"
                  checked={selectedChannels.has(channel.id)}
                  onChange={() => handleChannelToggle(channel.id)}
                  disabled={loading}
                />
                <label for={channel.id} class="cursor-pointer flex-1">
                  <span class="font-medium">#{channel.name}</span>
                  {channel.is_member && <span class="ml-2 text-xs text-green-600">✓ 参加済み</span>}
                  {channel.is_private && <span class="ml-2 text-xs text-gray-500">🔒 プライベート</span>}
                </label>
              </div>
            ))}
          </div>
          
          <button
            class="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"
            onClick={inviteToChannels}
            disabled={loading || selectedChannels.size === 0}
          >
            {loading ? '参加中...' : '選択したチャンネルに参加'}
          </button>
        </div>
      )}

      {message && (
        <div class={getMessageClass()}>
          {message.text}
        </div>
      )}
    </div>
  )
}