import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS
app.use('/*', cors())

// Main page with HTML form
app.get('/', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slack Channel Inviter</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            max-width: 500px;
            width: 100%;
        }

        h1 {
            color: #1f2937;
            margin-bottom: 0.5rem;
            font-size: 1.875rem;
        }

        .subtitle {
            color: #6b7280;
            margin-bottom: 2rem;
            font-size: 0.875rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            color: #374151;
            font-weight: 500;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
        }

        input, select, textarea {
            width: 100%;
            padding: 0.625rem 0.875rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.875rem;
            transition: all 0.2s;
            background: #f9fafb;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
        }

        button {
            width: 100%;
            padding: 0.75rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        button:hover:not(:disabled) {
            background: #5a67d8;
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.3);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .message {
            padding: 0.75rem;
            border-radius: 8px;
            margin-top: 1rem;
            font-size: 0.875rem;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .loading {
            display: inline-block;
            width: 14px;
            height: 14px;
            margin-right: 8px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Slack Channel Inviter</h1>
        <p class="subtitle">複数のチャンネルに一度に参加できます</p>

        <div class="form-group">
            <label for="token">Slack Token (Bot Token xoxb- or User Token xoxp-)</label>
            <input type="password" id="token" name="token"
                   placeholder="xoxb-... または xoxp-...">
        </div>

        <div class="form-group">
            <label for="pattern">チャンネル名パターン（オプション）</label>
            <input type="text" id="pattern" name="pattern"
                   placeholder="例: 2025-ex_">
        </div>

        <div class="form-group">
            <label>マッチング方式</label>
            <div style="display: flex; gap: 1rem;">
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="matchType" value="prefix" checked style="margin-right: 0.5rem;">
                    前方一致
                </label>
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="matchType" value="suffix" style="margin-right: 0.5rem;">
                    後方一致
                </label>
            </div>
        </div>

        <div class="form-group">
            <label for="userId">特定ユーザーのID（オプション）</label>
            <input type="text" id="userId" name="userId"
                   placeholder="U1234567890">
        </div>

        <div class="form-group">
            <label style="display: flex; align-items: center;">
                <input type="checkbox" id="dryRun" checked style="margin-right: 0.5rem;">
                Dry Run（実際に参加せず対象チャンネルを確認）
            </label>
        </div>

        <button type="button" id="fetchChannelsBtn">
            <span id="fetchBtnText">チャンネル一覧を取得</span>
        </button>

        <div id="channelsSection" style="display: none;">
            <h2 style="margin: 1.5rem 0 1rem; color: #374151; font-size: 1.25rem;">チャンネルを選択</h2>
            <div id="channelsList" style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; margin-bottom: 1rem;">
            </div>

            <button type="button" id="joinChannelsBtn" disabled>
                <span id="joinBtnText">選択したチャンネルに参加</span>
            </button>
        </div>

        <div id="message"></div>
    </div>

    <script>
        const messageDiv = document.getElementById('message');
        const fetchChannelsBtn = document.getElementById('fetchChannelsBtn');
        const fetchBtnText = document.getElementById('fetchBtnText');
        const joinChannelsBtn = document.getElementById('joinChannelsBtn');
        const joinBtnText = document.getElementById('joinBtnText');
        const channelsSection = document.getElementById('channelsSection');
        const channelsList = document.getElementById('channelsList');

        let channels = [];
        let selectedChannels = new Set();

        // Add event listeners
        document.addEventListener('DOMContentLoaded', function() {
            fetchChannelsBtn.addEventListener('click', fetchChannels);
            joinChannelsBtn.addEventListener('click', inviteToChannels);
        });

        async function fetchChannels() {
            const token = document.getElementById('token').value.trim();
            const pattern = document.getElementById('pattern').value.trim();
            const matchType = document.querySelector('input[name="matchType"]:checked').value;
            const userId = document.getElementById('userId').value.trim();

            if (!token) {
                showMessage('トークンを入力してください', 'error');
                return;
            }

            console.log('Token format:', token.substring(0, 10) + '...'); // Log token prefix
            console.log('Making request to: /api/slack/conversations.list');

            fetchChannelsBtn.disabled = true;
            fetchBtnText.innerHTML = '<span class="loading"></span>チャンネル一覧を取得中...';
            messageDiv.innerHTML = '';

            try {
                // Use POST with form-encoded body (more reliable for Slack API)
                const params = new URLSearchParams({
                    token: token,
                    types: 'public_channel',
                    exclude_archived: 'true',
                    limit: '1000'
                });

                const response = await fetch('/api/slack/conversations.list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params.toString()
                });

                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                if (data.ok) {
                    channels = data.channels || [];

                    // Filter channels by pattern
                    let filteredChannels = channels;
                    if (pattern) {
                        filteredChannels = channels.filter(channel => {
                            if (matchType === 'prefix') {
                                return channel.name.startsWith(pattern);
                            } else {
                                return channel.name.endsWith(pattern);
                            }
                        });
                    }

                    // Filter by user membership if userId is provided
                    if (userId) {
                        const channelsWithUser = [];
                        for (const channel of filteredChannels) {
                            try {
                                const membersParams = new URLSearchParams({
                                    token: token,
                                    channel: channel.id,
                                    limit: '1000'
                                });

                                const membersResponse = await fetch('/api/slack/conversations.members', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded'
                                    },
                                    body: membersParams.toString()
                                });
                                const membersData = await membersResponse.json();
                                if (membersData.ok && membersData.members && membersData.members.includes(userId)) {
                                    channelsWithUser.push(channel);
                                }
                            } catch (err) {
                                console.error('Failed to fetch members for channel ' + channel.id, err);
                            }
                        }
                        filteredChannels = channelsWithUser;
                    }

                    displayChannels(filteredChannels);
                    channelsSection.style.display = 'block';
                    showMessage('全' + channels.length + '個中、' + filteredChannels.length + '個のチャンネルが条件に一致しました', 'success');
                } else {
                    showMessage('エラー: ' + (data.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                showMessage('リクエストの送信に失敗しました: ' + error.message, 'error');
            } finally {
                fetchChannelsBtn.disabled = false;
                fetchBtnText.textContent = \`チャンネル一覧を取得\`;
            }
        }

        function displayChannels(filteredChannels) {
            channelsList.innerHTML = '';
            // Store filtered channels globally for Dry Run
            window.displayedChannels = filteredChannels;
            filteredChannels.forEach(channel => {
                const div = document.createElement('div');
                div.style.cssText = 'padding: 0.5rem; display: flex; align-items: center; cursor: pointer; hover: background: #f9fafb;';
                div.innerHTML = '<input type="checkbox" class="channel-checkbox" id="ch_' + channel.id + '" data-channel-id="' + channel.id + '" style="margin-right: 0.75rem;">' +
                    '<label for="ch_' + channel.id + '" style="cursor: pointer; flex: 1;">' +
                    '<span style="font-weight: 500;">#' + channel.name + '</span>' +
                    (channel.is_member ? '<span style="margin-left: 0.5rem; color: #10b981; font-size: 0.75rem;">✓ 参加済み</span>' : '') +
                    (channel.is_private ? '<span style="margin-left: 0.5rem; color: #6b7280; font-size: 0.75rem;">🔒 プライベート</span>' : '') +
                    '</label>';
                channelsList.appendChild(div);
            });

            // Add event listeners to all checkboxes
            document.querySelectorAll('.channel-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const channelId = this.dataset.channelId;
                    if (this.checked) {
                        selectedChannels.add(channelId);
                    } else {
                        selectedChannels.delete(channelId);
                    }
                    joinChannelsBtn.disabled = selectedChannels.size === 0;
                });
            });
        }

        async function inviteToChannels() {
            if (selectedChannels.size === 0) {
                showMessage('チャンネルを選択してください', 'error');
                return;
            }

            const token = document.getElementById('token').value.trim();
            const isDryRun = document.getElementById('dryRun').checked;
            const isUserToken = token.startsWith('xoxp-');

            // If Dry Run mode, show selected channels and return
            if (isDryRun) {
                const selectedChannelNames = [];
                window.displayedChannels.forEach(channel => {
                    if (selectedChannels.has(channel.id)) {
                        selectedChannelNames.push(channel.name);
                    }
                });
                showMessage('【Dry Run】以下の' + selectedChannelNames.length + '個のチャンネルに参加予定:\\n' + selectedChannelNames.join(', '), 'info');
                return;
            }

            joinChannelsBtn.disabled = true;
            joinBtnText.innerHTML = '<span class="loading"></span>' + selectedChannels.size + '個のチャンネルに参加中...';

            const results = [];

            for (const channelId of selectedChannels) {
                try {
                    const endpoint = isUserToken ? 'conversations.join' : 'conversations.invite';

                    const joinParams = new URLSearchParams({
                        token: token,
                        channel: channelId
                    });

                    // Bot tokenの場合はユーザーIDが必要
                    if (!isUserToken) {
                        // TODO: Bot tokenの場合、実際のユーザーIDを設定する必要があります
                        joinParams.append('users', 'U_YOUR_USER_ID');
                    }

                    const response = await fetch('/api/slack/' + endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: joinParams.toString()
                    });

                    const data = await response.json();
                    results.push({ channelId, success: data.ok, error: data.error });
                } catch (error) {
                    results.push({ channelId, success: false, error: error.message });
                }
            }

            const successCount = results.filter(r => r.success).length;
            const messageType = successCount === results.length ? 'success' : 'warning';
            showMessage(successCount + '/' + results.length + '個のチャンネルへの参加が完了しました', messageType);

            // Reset selection
            selectedChannels.clear();
            Array.from(document.querySelectorAll('#channelsList input[type="checkbox"]')).forEach(cb => {
                cb.checked = false;
            });
            joinChannelsBtn.disabled = true;
            joinBtnText.textContent = \`選択したチャンネルに参加\`;
        }

        function showMessage(text, type) {
            let className = 'message ';
            if (type === 'success') className += 'success';
            else if (type === 'error') className += 'error';
            else if (type === 'warning') {
                // Add warning style
                className = 'message';
                messageDiv.innerHTML = '<div class="' + className + '" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">' + text + '</div>';
                return;
            } else if (type === 'info') {
                // Add info style
                className = 'message';
                messageDiv.innerHTML = '<div class="' + className + '" style="background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; white-space: pre-wrap;">' + text + '</div>';
                return;
            }
            messageDiv.innerHTML = '<div class="' + className + '">' + text + '</div>';
        }
    </script>
</body>
</html>
  `
  return c.html(html)
})

// Slack API proxy endpoint
app.all('/api/slack/*', async (c) => {
  const path = c.req.path.replace('/api/slack/', '')
  const queryString = c.req.url.split('?')[1] || ''
  const contentType = c.req.header('Content-Type') || ''

  let token = null
  let bodyToForward = null

  console.log('Proxy endpoint called:')
  console.log('  Path:', path)
  console.log('  Method:', c.req.method)
  console.log('  Query:', queryString)
  console.log('  Content-Type:', contentType)

  // Try to get token from different sources
  // 1. Authorization header
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    token = authHeader.replace('Bearer ', '')
    console.log('  Token from auth header:', token.substring(0, 10) + '...')
  }

  // 2. If no auth header and it's form-encoded, get token from body
  if (!token && contentType.includes('application/x-www-form-urlencoded')) {
    const body = await c.req.text()
    const params = new URLSearchParams(body)
    token = params.get('token')

    // The body already contains the token, so forward it as-is
    bodyToForward = body

    console.log('  Token from body:', token ? token.substring(0, 10) + '...' : 'NO TOKEN')
    console.log('  Body params:', body)
  }

  if (!token) {
    console.log('No token provided, returning 401')
    return c.json({ error: 'No token provided' }, 401)
  }

  try {
    const url = `https://slack.com/api/${path}`

    let options = {
      method: 'POST',  // Slack API works best with POST
      headers: {}
    }

    // If we have form-encoded body with token, forward it as-is
    if (bodyToForward) {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      options.body = bodyToForward
    } else {
      // Otherwise, create form-encoded body with token
      const params = new URLSearchParams()
      params.append('token', token)

      // Add query parameters to body
      if (queryString) {
        const queryParams = new URLSearchParams(queryString)
        for (const [key, value] of queryParams) {
          params.append(key, value)
        }
      }

      // If POST with JSON body, convert to form-encoded
      if (c.req.method === 'POST' && c.req.header('Content-Type')?.includes('application/json')) {
        const body = await c.req.text()
        const jsonData = JSON.parse(body)
        for (const [key, value] of Object.entries(jsonData)) {
          if (key !== 'token') {  // Don't duplicate token
            params.append(key, value)
          }
        }
      }

      options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      options.body = params.toString()
    }

    console.log('Making request to Slack API:')
    console.log('  URL:', url)
    console.log('  Headers:', {
      'Authorization': 'Bearer ' + token.substring(0, 10) + '...',
      'Content-Type': options.headers['Content-Type']
    })

    const response = await fetch(url, options)
    const data = await response.json()
    console.log('Slack API response:', JSON.stringify(data, null, 2))
    return c.json(data)
  } catch (error) {
    return c.json({
      error: 'Failed to proxy request',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})