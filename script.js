class SlackChannelInviter {
    constructor() {
        this.form = document.getElementById('inviteForm');
        this.loading = document.getElementById('loading');
        this.results = document.getElementById('results');
        this.error = document.getElementById('error');
        this.resultContent = document.getElementById('resultContent');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        this.clearMessages();
        this.showLoading(true);

        const formData = new FormData(this.form);
        const token = formData.get('token');
        const pattern = formData.get('pattern');
        const matchType = formData.get('matchType');
        const userId = formData.get('userId');
        const dryRun = document.getElementById('dryRun').checked;

        try {
            // Basic token validation
            if (!token.startsWith('xoxb-') && !token.startsWith('xoxp-')) {
                throw new Error('Invalid token format. Token should start with "xoxb-" or "xoxp-"');
            }

            // Get all channels
            const channels = await this.getAllChannels(token);
            
            // Filter channels by pattern
            let targetChannels = this.filterChannelsByPattern(channels, pattern, matchType);
            
            // Filter by user membership if userId is provided
            if (userId && userId.trim()) {
                targetChannels = await this.filterChannelsByUser(token, targetChannels, userId.trim());
            }

            // Filter out channels we're already a member of
            targetChannels = targetChannels.filter(ch => !ch.is_member);

            if (targetChannels.length === 0) {
                this.showInfo('対象となるチャンネルが見つかりませんでした。');
                return;
            }

            // Display results
            if (dryRun) {
                this.displayDryRunResults(targetChannels);
            } else {
                await this.joinChannelsAndDisplayResults(token, targetChannels);
            }

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async getAllChannels(token) {
        const channels = [];
        let cursor = undefined;

        do {
            const params = new URLSearchParams({
                limit: '1000',
                types: 'public_channel',
                exclude_archived: 'true'
            });

            if (cursor) {
                params.append('cursor', cursor);
            }

            const response = await fetch(`https://slack.com/api/conversations.list?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

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

    filterChannelsByPattern(channels, pattern, matchType) {
        return channels.filter(channel => {
            if (matchType === 'prefix') {
                return channel.name.startsWith(pattern);
            } else {
                return channel.name.endsWith(pattern);
            }
        });
    }

    async filterChannelsByUser(token, channels, userId) {
        const filteredChannels = [];

        for (const channel of channels) {
            try {
                const members = await this.getChannelMembers(token, channel.id);
                if (members.includes(userId)) {
                    filteredChannels.push(channel);
                }
            } catch (error) {
                console.error(`Error checking members for channel ${channel.name}:`, error);
            }
        }

        return filteredChannels;
    }

    async getChannelMembers(token, channelId) {
        const members = [];
        let cursor = undefined;

        do {
            const params = new URLSearchParams({
                channel: channelId,
                limit: '1000'
            });

            if (cursor) {
                params.append('cursor', cursor);
            }

            const response = await fetch(`https://slack.com/api/conversations.members?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!data.ok) {
                if (data.error === 'channel_not_found' || data.error === 'not_in_channel') {
                    return [];
                }
                throw new Error(`Failed to fetch members: ${data.error}`);
            }

            if (data.members) {
                members.push(...data.members);
            }

            cursor = data.response_metadata?.next_cursor;
        } while (cursor);

        return members;
    }

    async joinChannel(token, channelId) {
        const response = await fetch('https://slack.com/api/conversations.join', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel: channelId
            })
        });

        return response.json();
    }

    displayDryRunResults(channels) {
        const html = `
            <h3>Dry Run 結果</h3>
            <p>以下の${channels.length}個のチャンネルが対象です：</p>
            <ul class="channel-list">
                ${channels.map(ch => `<li>#${this.escapeHtml(ch.name)}</li>`).join('')}
            </ul>
            <p>実際に参加するには、「Dry Run」のチェックを外して再度実行してください。</p>
        `;
        
        this.resultContent.innerHTML = html;
        this.results.classList.remove('hidden');
    }

    async joinChannelsAndDisplayResults(token, channels) {
        const results = [];
        
        for (const channel of channels) {
            try {
                const result = await this.joinChannel(token, channel.id);
                results.push({
                    channel: channel.name,
                    success: result.ok,
                    error: result.error
                });
                
                // Rate limit protection
                await this.sleep(1000);
            } catch (error) {
                results.push({
                    channel: channel.name,
                    success: false,
                    error: error.message
                });
            }
        }

        this.displayJoinResults(results);
    }

    displayJoinResults(results) {
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        const html = `
            <h3>実行結果</h3>
            <p>成功: ${successCount}個 / 失敗: ${failureCount}個</p>
            
            ${successCount > 0 ? `
                <h4>✅ 成功したチャンネル</h4>
                <ul class="channel-list success">
                    ${results.filter(r => r.success).map(r => 
                        `<li>#${this.escapeHtml(r.channel)}</li>`
                    ).join('')}
                </ul>
            ` : ''}
            
            ${failureCount > 0 ? `
                <h4>❌ 失敗したチャンネル</h4>
                <ul class="channel-list error">
                    ${results.filter(r => !r.success).map(r => 
                        `<li>#${this.escapeHtml(r.channel)} - ${this.escapeHtml(r.error || 'Unknown error')}</li>`
                    ).join('')}
                </ul>
            ` : ''}
        `;
        
        this.resultContent.innerHTML = html;
        this.results.classList.remove('hidden');
    }

    showLoading(show) {
        if (show) {
            this.loading.classList.remove('hidden');
            document.getElementById('submitBtn').disabled = true;
        } else {
            this.loading.classList.add('hidden');
            document.getElementById('submitBtn').disabled = false;
        }
    }

    showError(message) {
        this.error.textContent = `エラー: ${message}`;
        this.error.classList.remove('hidden');
    }

    showInfo(message) {
        this.resultContent.innerHTML = `<p class="info">${this.escapeHtml(message)}</p>`;
        this.results.classList.remove('hidden');
    }

    clearMessages() {
        this.error.classList.add('hidden');
        this.results.classList.add('hidden');
        this.error.textContent = '';
        this.resultContent.innerHTML = '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SlackChannelInviter();
});