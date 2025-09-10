import { useState } from 'hono/jsx'

export default function SlackInviter() {
  const [token, setToken] = useState('')
  const [pattern, setPattern] = useState('')
  const [matchType, setMatchType] = useState('prefix')
  const [userId, setUserId] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/slack/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          pattern,
          matchType,
          userId,
          dryRun,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request')
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="inviter-container">
      <form onSubmit={handleSubmit} class="invite-form">
        <div class="form-group">
          <label for="token">Slack Token (xoxb- or xoxp-):</label>
          <input
            type="password"
            id="token"
            value={token}
            onInput={(e) => setToken((e.target as HTMLInputElement).value)}
            required
            placeholder="xoxb-..."
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="pattern">Channel Pattern:</label>
          <input
            type="text"
            id="pattern"
            value={pattern}
            onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
            required
            placeholder="2025-ex_"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="matchType">Match Type:</label>
          <select
            id="matchType"
            value={matchType}
            onChange={(e) => setMatchType((e.target as HTMLSelectElement).value)}
            class="form-select"
          >
            <option value="prefix">Prefix (starts with)</option>
            <option value="suffix">Suffix (ends with)</option>
            <option value="contains">Contains</option>
            <option value="regex">Regular Expression</option>
          </select>
        </div>

        <div class="form-group">
          <label for="userId">Filter by User ID (optional):</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onInput={(e) => setUserId((e.target as HTMLInputElement).value)}
            placeholder="U1234567890"
            class="form-input"
          />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun((e.target as HTMLInputElement).checked)}
            />
            Dry Run (preview channels without joining)
          </label>
        </div>

        <button type="submit" disabled={loading} class="submit-button">
          {loading ? 'Processing...' : dryRun ? 'Preview Channels' : 'Join Channels'}
        </button>
      </form>

      {error && (
        <div class="error-message">
          Error: {error}
        </div>
      )}

      {results && (
        <div class="results">
          <h2>Results</h2>
          {results.dryRun ? (
            <div>
              <p>Found {results.count} channels to join:</p>
              <ul class="channel-list">
                {results.channels?.map((ch: any) => (
                  <li key={ch.id}>#{ch.name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p>Processed {results.count} channels:</p>
              <ul class="results-list">
                {results.results?.map((result: any, index: number) => (
                  <li key={index} class={result.success ? 'success' : 'error'}>
                    #{result.channel}: {result.success ? '✓ Joined' : `✗ ${result.error}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}