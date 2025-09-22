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
        <p class="subtitle">複数のユーザーを一度にチャンネルに招待できます</p>

        <form id="inviteForm">
            <div class="form-group">
                <label for="token">Slack Token</label>
                <input type="password" id="token" name="token" required
                       placeholder="xoxb-your-token-here">
            </div>

            <div class="form-group">
                <label for="channel">Channel ID</label>
                <input type="text" id="channel" name="channel" required
                       placeholder="C1234567890">
            </div>

            <div class="form-group">
                <label for="users">User IDs (カンマ区切り)</label>
                <textarea id="users" name="users" required
                          placeholder="U1234567890, U0987654321, U1111111111"></textarea>
            </div>

            <button type="submit" id="submitBtn">
                <span id="btnText">招待を送信</span>
            </button>
        </form>

        <div id="message"></div>
    </div>

    <script>
        const form = document.getElementById('inviteForm');
        const messageDiv = document.getElementById('message');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const token = document.getElementById('token').value.trim();
            const channel = document.getElementById('channel').value.trim();
            const usersText = document.getElementById('users').value.trim();

            if (!token || !channel || !usersText) {
                showMessage('すべてのフィールドを入力してください', 'error');
                return;
            }

            const userIds = usersText.split(',').map(id => id.trim()).filter(id => id);

            if (userIds.length === 0) {
                showMessage('少なくとも1人のユーザーIDを入力してください', 'error');
                return;
            }

            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="loading"></span>処理中...';
            messageDiv.innerHTML = '';

            try {
                const response = await fetch('/api/slack/conversations.invite', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        channel: channel,
                        users: userIds.join(',')
                    })
                });

                const data = await response.json();

                if (data.ok) {
                    showMessage('ユーザーをチャンネルに正常に招待しました！', 'success');
                    document.getElementById('users').value = '';
                } else {
                    showMessage('エラー: ' + (data.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                showMessage('リクエストの送信に失敗しました: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                btnText.textContent = '招待を送信';
            }
        });

        function showMessage(text, type) {
            messageDiv.innerHTML = '<div class="message ' + type + '">' + text + '</div>';
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