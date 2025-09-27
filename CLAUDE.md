# Slack Channel Invitation Tool - Claude Documentation

## Overview
This is a web-based tool for joining Slack channels that match specific patterns. Users can search for channels and join them through a simple web interface.

## Architecture
- **Framework**: Next.js
- **Structure**: API Routes in `/app/api` directory with embedded HTML/CSS/JS
- **API Pattern**: Proxy pattern for Slack API calls through `/api/slack/*` endpoints
- **Deployment**: Designed for Vercel (Next.js default deployment)

## Common Commands
```bash
# Install dependencies
pnpm install

# Development (with auto-reload)
pnpm dev

# Production
pnpm start

# Test locally
python3 -m http.server 8000
# or
npx http-server
```

## Key Implementation Details

### Slack API Authentication
- **Important**: Use form-encoded POST with token in body (NOT Bearer header)
- Token types:
  - Bot Token (`xoxb-`): Requires target user ID for channel invitations
  - User Token (`xoxp-`): Joins channels directly as the token owner

### Required Slack Token Scopes
- `channels:read` - Read public channel list
- `channels:write.invites` - Join/invite to channels

### File Structure
```
/app/page.tsx                    # Main UI page
/app/api/slack/[endpoint]/route.ts  # Slack API proxy routes
/package.json                    # Dependencies and scripts
/pnpm-lock.yaml                 # Lock file
/README.md                      # User documentation
```

### Important Code Patterns

#### Slack API Proxy (form-encoded)
```javascript
// Critical: Must use form-encoded POST with token in body
const formData = new URLSearchParams();
formData.append('token', token);
// Add other params...

const response = await fetch(`https://slack.com/api/${endpoint}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: formData.toString()
});
```

#### UI Features
- Mobile responsive design
- Channel pattern matching (prefix/suffix)
- User filtering by Slack user ID
- Token validation instructions
- No DryRun mode (simplified to just fetch and join)

### Known Issues and Fixes
1. **Slack API authentication**: Must use form-encoded POST, not Bearer headers
2. **JavaScript element IDs**: Use unique IDs (e.g., `filterUserId` not `userId`) to avoid conflicts
3. **Template literals in embedded JS**: Use string concatenation to avoid escaping issues

### Testing Token Validity
Users can test their token with:
```bash
curl -X POST https://slack.com/api/auth.test \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=xoxb-YOUR-TOKEN"
```

### Setup Instructions for Users
1. Create Slack app at https://api.slack.com/apps
2. Add required OAuth scopes
3. Install app to workspace
4. Copy Bot User OAuth Token
5. Use token in the web interface

## Development Notes
- The application runs on port 3000 by default
- Standard Next.js deployment (just run `npm run build` and deploy)
- Responsive CSS breakpoint at 600px for mobile devices

## Git Branch Info
- Main branch used for PRs
- Current feature branch: `fix-vercel-deployment`