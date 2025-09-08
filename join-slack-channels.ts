#!/usr/bin/env bun

interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_archived: boolean;
  is_member: boolean;
}

interface SlackResponse {
  ok: boolean;
  channels?: SlackChannel[];
  error?: string;
  response_metadata?: {
    next_cursor?: string;
  };
}

interface JoinResponse {
  ok: boolean;
  channel?: {
    id: string;
    name: string;
  };
  error?: string;
}

async function getAllChannels(token: string): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      token,
      limit: '1000',
      types: 'public_channel',
      exclude_archived: 'true',
    });

    if (cursor) {
      params.append('cursor', cursor);
    }

    const response = await fetch(`https://slack.com/api/conversations.list?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: SlackResponse = await response.json();

    if (!data.ok) {
      throw new Error(`Failed to fetch channels: ${data.error}`);
    }

    if (data.channels) {
      channels.push(...data.channels);
    }

    cursor = data.response_metadata?.next_cursor;
  } while (cursor);

  return channels;
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
  });

  return response.json();
}

async function main() {
  const token = process.env.SLACK_BOT_TOKEN || process.env.SLACK_TOKEN;

  if (!token) {
    console.error('Error: SLACK_BOT_TOKEN or SLACK_TOKEN environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('Fetching all channels...');
    const channels = await getAllChannels(token);
    
    const targetChannels = channels.filter(
      channel => channel.name.startsWith('2025-ex_') && !channel.is_member
    );

    if (targetChannels.length === 0) {
      console.log('No channels starting with "2025-ex_" found that you are not already a member of.');
      return;
    }

    console.log(`Found ${targetChannels.length} channels to join:`);
    targetChannels.forEach(ch => console.log(`  - ${ch.name}`));
    console.log('');

    for (const channel of targetChannels) {
      console.log(`Joining #${channel.name}...`);
      
      try {
        const result = await joinChannel(token, channel.id);
        
        if (result.ok) {
          console.log(`  ✓ Successfully joined #${channel.name}`);
        } else {
          console.error(`  ✗ Failed to join #${channel.name}: ${result.error}`);
        }
      } catch (error) {
        console.error(`  ✗ Error joining #${channel.name}:`, error);
      }

      // Add a small delay to avoid rate limiting
      await Bun.sleep(1000);
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();