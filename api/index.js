import { Hono } from 'hono'
import { handle } from 'hono/vercel'

// Create a new Hono app for Vercel
const app = new Hono()

// Proxy all Slack API calls
app.all('/api/slack/*', async (c) => {
  const path = c.req.path.replace('/api/slack/', '')
  const url = `https://slack.com/api/${path}`
  
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'No token provided' }, 401)
  }

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
})

// Serve the main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Slack Channel Inviter</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
        <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Slack Channel Inviter</h1>
        
        <div class="mb-6">
          <label for="token" class="block text-sm font-medium text-gray-700 mb-2">
            Slack Token (Bot Token xoxb- or User Token xoxp-)
          </label>
          <input
            type="password"
            id="token"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="xoxb-... または xoxp-..."
          />
        </div>

        <button
          id="fetchChannelsBtn"
          class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors mb-6"
        >
          チャンネル一覧を取得
        </button>

        <div id="channelsList" class="hidden">
          <h2 class="text-xl font-semibold mb-4">チャンネルを選択</h2>
          <div id="channels" class="space-y-2 mb-6 max-h-96 overflow-y-auto"></div>
          
          <button
            id="inviteBtn"
            class="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            選択したチャンネルに参加
          </button>
        </div>

        <div id="message" class="mt-4 text-center"></div>
      </div>

      <script>
        const tokenInput = document.getElementById('token');
        const fetchChannelsBtn = document.getElementById('fetchChannelsBtn');
        const channelsList = document.getElementById('channelsList');
        const channelsDiv = document.getElementById('channels');
        const inviteBtn = document.getElementById('inviteBtn');
        const messageDiv = document.getElementById('message');

        let selectedChannels = new Set();
        let isUserToken = false;

        fetchChannelsBtn.addEventListener('click', async () => {
          const token = tokenInput.value.trim();
          if (!token) {
            showMessage('トークンを入力してください', 'error');
            return;
          }

          isUserToken = token.startsWith('xoxp-');
          showMessage('チャンネル一覧を取得中...', 'info');

          try {
            const response = await fetch('/api/slack/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=1000', {
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });

            const data = await response.json();
            
            if (data.ok) {
              displayChannels(data.channels);
              channelsList.classList.remove('hidden');
              showMessage(\`\${data.channels.length}個のチャンネルを取得しました\`, 'success');
            } else {
              showMessage(\`エラー: \${data.error}\`, 'error');
            }
          } catch (error) {
            showMessage(\`エラー: \${error.message}\`, 'error');
          }
        });

        function displayChannels(channels) {
          channelsDiv.innerHTML = '';
          channels.forEach(channel => {
            const div = document.createElement('div');
            div.className = 'flex items-center p-2 hover:bg-gray-50 rounded';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = channel.id;
            checkbox.className = 'mr-3';
            checkbox.addEventListener('change', (e) => {
              if (e.target.checked) {
                selectedChannels.add(channel.id);
              } else {
                selectedChannels.delete(channel.id);
              }
            });

            const label = document.createElement('label');
            label.htmlFor = channel.id;
            label.className = 'cursor-pointer flex-1';
            label.innerHTML = \`
              <span class="font-medium">#\${channel.name}</span>
              \${channel.is_member ? '<span class="ml-2 text-xs text-green-600">✓ 参加済み</span>' : ''}
              \${channel.is_private ? '<span class="ml-2 text-xs text-gray-500">🔒 プライベート</span>' : ''}
            \`;

            div.appendChild(checkbox);
            div.appendChild(label);
            channelsDiv.appendChild(div);
          });
        }

        inviteBtn.addEventListener('click', async () => {
          const token = tokenInput.value.trim();
          if (selectedChannels.size === 0) {
            showMessage('チャンネルを選択してください', 'error');
            return;
          }

          showMessage(\`\${selectedChannels.size}個のチャンネルに参加中...\`, 'info');
          
          const results = [];
          for (const channelId of selectedChannels) {
            try {
              const endpoint = isUserToken ? 'conversations.join' : 'conversations.invite';
              const body = isUserToken 
                ? { channel: channelId }
                : { channel: channelId, users: 'U_YOUR_USER_ID' }; // Bot tokenの場合はユーザーIDが必要

              const response = await fetch(\`/api/slack/\${endpoint}\`, {
                method: 'POST',
                headers: {
                  'Authorization': \`Bearer \${token}\`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
              });

              const data = await response.json();
              results.push({ channelId, success: data.ok, error: data.error });
            } catch (error) {
              results.push({ channelId, success: false, error: error.message });
            }
          }

          const successCount = results.filter(r => r.success).length;
          showMessage(\`\${successCount}/\${results.length}個のチャンネルへの参加が完了しました\`, successCount === results.length ? 'success' : 'warning');
          
          // Reset selection
          selectedChannels.clear();
          document.querySelectorAll('#channels input[type="checkbox"]').forEach(cb => cb.checked = false);
        });

        function showMessage(text, type) {
          messageDiv.className = 'mt-4 text-center p-3 rounded';
          if (type === 'error') {
            messageDiv.className += ' bg-red-100 text-red-700';
          } else if (type === 'success') {
            messageDiv.className += ' bg-green-100 text-green-700';
          } else if (type === 'warning') {
            messageDiv.className += ' bg-yellow-100 text-yellow-700';
          } else {
            messageDiv.className += ' bg-blue-100 text-blue-700';
          }
          messageDiv.textContent = text;
        }
      </script>
    </body>
    </html>
  `)
})

export default handle(app)