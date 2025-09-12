export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, endpoint, params } = req.body;

    if (!token || !endpoint) {
      return res.status(400).json({ error: 'Token and endpoint are required' });
    }

    // Construct Slack API URL
    const slackUrl = `https://slack.com/api/${endpoint}`;

    // Make request to Slack API
    const response = await fetch(slackUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {}),
    });

    const data = await response.json();
    
    // Return Slack API response
    return res.status(200).json(data);
  } catch (error) {
    console.error('Slack API proxy error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
}