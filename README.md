# Slack Channel Invitation Tool

GitHub Pagesで動作するSlackチャンネル招待ツールです。指定したパターンに一致するチャンネルに自動で参加できます。

## 機能

- チャンネル名の前方一致・後方一致検索
- 特定ユーザーが参加しているチャンネルへの絞り込み
- Dry Runモード（実際に参加せず対象チャンネルを確認）
- レート制限対策

## セキュリティに関する注意事項

⚠️ **重要**: このツールはクライアントサイドで動作するため、以下の点にご注意ください：

- Slack Tokenはブラウザ上で処理されます
- HTTPSを使用していても、完全なセキュリティは保証されません
- 信頼できる環境でのみ使用してください
- 使用後はブラウザのキャッシュをクリアすることを推奨します
- cloneした場合でも簡単に動作します

## GitHub Pagesへのデプロイ方法

1. このリポジトリをForkまたは新規リポジトリとして作成

2. 以下のファイルをリポジトリに配置：
   - `index.html`
   - `script.js`
   - `style.css`

3. GitHub Pagesを有効化：
   - リポジトリの Settings → Pages
   - Source: Deploy from a branch
   - Branch: main (または master)
   - Folder: / (root)
   - Save

4. 数分待つとサイトが公開されます：
   - URL: `https://[username].github.io/[repository-name]/`

## 必要なSlack Token権限

以下のいずれかのトークンが使用できます：

### Bot User OAuth Token (`xoxb-`で始まるトークン)
以下のスコープが必要です：
- `channels:read` - パブリックチャンネル一覧の取得
- `channels:join` - パブリックチャンネルへの参加  
- `users:read` - ユーザー情報の取得（ユーザーIDフィルタ使用時）

### User OAuth Token (`xoxp-`で始まるトークン)
以下のスコープが必要です：
- `channels:read` - パブリックチャンネル一覧の取得
- `channels:write` - パブリックチャンネルへの参加
- `users:read` - ユーザー情報の取得（ユーザーIDフィルタ使用時）

**注意**: User Tokenは個人の認証情報を使用するため、Bot Tokenの使用を推奨します。

## 使用方法

1. サイトにアクセス
2. Slack Bot Tokenを入力
3. チャンネル名パターンを入力（例: `2025-ex_`）
4. 前方一致または後方一致を選択
5. （オプション）特定ユーザーのIDを入力して絞り込み
6. Dry Runモードで対象チャンネルを確認
7. Dry Runのチェックを外して実際に参加

## ローカルでのテスト

```bash
# Python 3を使用
python3 -m http.server 8000

# またはNode.jsのhttp-serverを使用
npx http-server

# ブラウザでアクセス
open http://localhost:8000
```

## トラブルシューティング

### "Invalid token format"エラー
- Tokenが`xoxb-`または`xoxp-`で始まることを確認してください

### "Failed to fetch channels"エラー
- Tokenの権限を確認してください
- ネットワーク接続を確認してください

### レート制限エラー
- Slackのレート制限に達した場合は、しばらく待ってから再試行してください

## ライセンス

MIT