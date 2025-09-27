'use client';

import { useState, useEffect } from 'react';

interface Channel {
  id: string;
  name: string;
  topic?: {
    value: string;
  };
  is_member?: boolean;
}

type Language = 'en' | 'ja';

const translations = {
  en: {
    title: '🚀 Slack Channel Invitation Tool',
    tokenInstructions: '📋 Getting Your Slack Token',
    tokenSteps: [
      'Go to Slack API Apps',
      'Create a new app or select existing one',
      'Go to "OAuth & Permissions"',
      'Add required scopes:',
      'Install app to workspace',
      'Copy the token you need'
    ],
    botTokenScopes: 'Bot Token (xoxb-): channels:read, channels:write.invites',
    userTokenScopes: 'User Token (xoxp-): channels:read, channels:write.invites, channels:write',
    slackToken: 'Slack Token',
    tokenPlaceholder: 'xoxb-... or xoxp-...',
    tokenHelp: 'Bot token (xoxb-) or User token (xoxp-)',
    channelPattern: 'Channel Pattern',
    patternPlaceholder: 'e.g., project-',
    patternHelp: 'Channels matching this pattern will be found',
    matchType: 'Match Type',
    prefix: 'Prefix (starts with)',
    suffix: 'Suffix (ends with)',
    contains: 'Contains',
    userIdToInvite: 'User ID to Invite',
    userIdPlaceholder: 'U1234567890',
    userIdHelp: 'User ID to invite to channels',
    filterByUser: 'Filter by User Membership',
    filterUserPlaceholder: 'U1234567890 (optional)',
    filterUserHelp: 'Only show channels this user is a member of',
    searchChannels: '🔍 Search Channels',
    joinSelectedChannels: '✅ Join Selected Channels',
    results: 'Channel List',
    channelsFound: 'Channels Found',
    joined: 'Joined',
    failed: 'Failed',
    errorTokenPattern: 'Please enter both token and pattern',
    errorFetchChannels: 'Failed to fetch channels',
    errorNoChannels: 'No channels found matching pattern',
    foundChannels: 'Found {count} channels matching "{pattern}"',
    errorEnterToken: 'Please enter a token',
    errorSelectChannels: 'Please select at least one channel',
    errorBotToken: 'Bot tokens require a User ID to invite',
    joiningChannels: 'Joining selected channels...',
    fetchingChannels: 'Searching channels...',
    completedJoin: 'Completed: {joined} joined, {failed} failed',
    joinedChannel: '✅ Joined #{channel}',
    failedJoinChannel: '❌ Failed to join #{channel}: {error}',
    errorJoinChannel: '❌ Error joining #{channel}: {error}',
    memberIndicator: '(member)',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selectedCount: '{count} channel(s) selected',
    noChannelsLoaded: 'No channels loaded. Please search for channels first.'
  },
  ja: {
    title: '🚀 Slackチャンネル招待ツール',
    tokenInstructions: '📋 Slackトークンの取得方法',
    tokenSteps: [
      'Slack API Appsにアクセス',
      '新しいアプリを作成または既存のアプリを選択',
      '「OAuth & Permissions」に移動',
      '必要なスコープを追加:',
      'ワークスペースにアプリをインストール',
      '必要なトークンをコピー'
    ],
    botTokenScopes: 'ボットトークン (xoxb-): channels:read, channels:write.invites',
    userTokenScopes: 'ユーザートークン (xoxp-): channels:read, channels:write.invites, channels:write',
    slackToken: 'Slackトークン',
    tokenPlaceholder: 'xoxb-... または xoxp-...',
    tokenHelp: 'ボットトークン (xoxb-) またはユーザートークン (xoxp-)',
    channelPattern: 'チャンネルパターン',
    patternPlaceholder: '例: project-',
    patternHelp: 'このパターンに一致するチャンネルが検索されます',
    matchType: 'マッチタイプ',
    prefix: '前方一致',
    suffix: '後方一致',
    contains: '部分一致',
    userIdToInvite: '招待するユーザーID',
    userIdPlaceholder: 'U1234567890',
    userIdHelp: 'チャンネルに招待するユーザーID',
    filterByUser: 'ユーザーメンバーシップでフィルター',
    filterUserPlaceholder: 'U1234567890 (オプション)',
    filterUserHelp: 'このユーザーが参加しているチャンネルのみ表示',
    searchChannels: '🔍 チャンネルを検索',
    joinSelectedChannels: '✅ 選択したチャンネルに参加',
    results: 'チャンネル一覧',
    channelsFound: '見つかったチャンネル',
    joined: '参加済み',
    failed: '失敗',
    errorTokenPattern: 'トークンとパターンの両方を入力してください',
    errorFetchChannels: 'チャンネルの取得に失敗しました',
    errorNoChannels: 'パターンに一致するチャンネルが見つかりませんでした',
    foundChannels: '「{pattern}」に一致する{count}個のチャンネルが見つかりました',
    errorEnterToken: 'トークンを入力してください',
    errorSelectChannels: '少なくとも1つのチャンネルを選択してください',
    errorBotToken: 'ボットトークンには招待するユーザーIDが必要です',
    joiningChannels: '選択したチャンネルに参加中...',
    fetchingChannels: 'チャンネルを検索中...',
    completedJoin: '完了: {joined}個参加、{failed}個失敗',
    joinedChannel: '✅ #{channel} に参加しました',
    failedJoinChannel: '❌ #{channel} への参加に失敗: {error}',
    errorJoinChannel: '❌ #{channel} への参加エラー: {error}',
    memberIndicator: '(参加済み)',
    selectAll: 'すべて選択',
    deselectAll: 'すべて解除',
    selectedCount: '{count}個のチャンネルを選択',
    noChannelsLoaded: 'チャンネルが読み込まれていません。先にチャンネルを検索してください。'
  }
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [token, setToken] = useState('');
  const [pattern, setPattern] = useState('');
  const [matchType, setMatchType] = useState('prefix');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterByUserMembership, setFilterByUserMembership] = useState('');
  const [matchedChannels, setMatchedChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    joined: 0,
    failed: 0
  });
  const [isBotToken, setIsBotToken] = useState(false);
  const [joinResults, setJoinResults] = useState<string[]>([]);

  const t = translations[language];

  useEffect(() => {
    setIsBotToken(token.startsWith('xoxb-'));
  }, [token]);

  const toggleChannelSelection = (channelId: string) => {
    const newSelection = new Set(selectedChannels);
    if (newSelection.has(channelId)) {
      newSelection.delete(channelId);
    } else {
      newSelection.add(channelId);
    }
    setSelectedChannels(newSelection);
  };

  const selectAll = () => {
    const allIds = matchedChannels.map(ch => ch.id);
    setSelectedChannels(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedChannels(new Set());
  };

  const fetchChannels = async () => {
    if (!token || !pattern) {
      alert(t.errorTokenPattern);
      return;
    }

    setLoading(true);
    setJoinResults([]);
    setStats({ total: 0, joined: 0, failed: 0 });

    try {
      const response = await fetch('/api/slack/conversations.list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!data.ok) {
        alert(`${t.errorFetchChannels}: ${data.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      let filtered = data.channels.filter((channel: Channel) => {
        if (matchType === 'prefix') {
          return channel.name.startsWith(pattern);
        } else if (matchType === 'suffix') {
          return channel.name.endsWith(pattern);
        } else {
          return channel.name.includes(pattern);
        }
      });

      if (filterByUserMembership) {
        const userConversationsResponse = await fetch('/api/slack/users.conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            user: filterByUserMembership,
            types: 'public_channel',
            limit: 1000
          })
        });

        const userConversationsData = await userConversationsResponse.json();

        if (userConversationsData.ok) {
          const userChannelIds = new Set(userConversationsData.channels.map((ch: any) => ch.id));
          filtered = filtered.filter((channel: Channel) => userChannelIds.has(channel.id));
        }
      }

      setMatchedChannels(filtered);
      setSelectedChannels(new Set());
      setShowResults(true);

      if (filtered.length === 0) {
        alert(`${t.errorNoChannels}: ${pattern}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const joinSelectedChannels = async () => {
    if (!token) {
      alert(t.errorEnterToken);
      return;
    }

    if (selectedChannels.size === 0) {
      alert(t.errorSelectChannels);
      return;
    }

    const isUserToken = token.startsWith('xoxp-');
    if (!isUserToken && !filterUserId) {
      alert(t.errorBotToken);
      return;
    }

    setLoading(true);
    let joined = 0;
    let failed = 0;
    const results: string[] = [];

    const channelsToJoin = matchedChannels.filter(ch => selectedChannels.has(ch.id));

    for (const channel of channelsToJoin) {
      try {
        const endpoint = isUserToken ? 'conversations.join' : 'conversations.invite';
        const body = isUserToken
          ? { token, channel: channel.id }
          : { token, channel: channel.id, users: filterUserId };

        const response = await fetch(`/api/slack/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.ok) {
          joined++;
          const joinedMsg = t.joinedChannel.replace('{channel}', channel.name);
          results.push(joinedMsg);
        } else {
          failed++;
          const failedMsg = t.failedJoinChannel
            .replace('{channel}', channel.name)
            .replace('{error}', data.error);
          results.push(failedMsg);
        }
      } catch (error: any) {
        failed++;
        const errorMsg = t.errorJoinChannel
          .replace('{channel}', channel.name)
          .replace('{error}', error.message);
        results.push(errorMsg);
      }

      setStats({ total: channelsToJoin.length, joined, failed });
    }

    setJoinResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-5">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {t.title}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded ${
                language === 'en'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ja')}
              className={`px-3 py-1 rounded ${
                language === 'ja'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              JA
            </button>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{t.tokenInstructions}</h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            {t.tokenSteps.map((step, index) => (
              <li key={index}>
                {index === 0 ? (
                  <>
                    {language === 'en' ? 'Go to ' : ''}
                    <a href="https://api.slack.com/apps" target="_blank" className="text-purple-600 hover:underline">
                      Slack API Apps
                    </a>
                    {language === 'ja' ? 'にアクセス' : ''}
                  </>
                ) : index === 3 ? (
                  <>
                    {step}
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li className="text-xs">{t.botTokenScopes}</li>
                      <li className="text-xs">{t.userTokenScopes}</li>
                    </ul>
                  </>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              {t.slackToken}
            </label>
            <input
              type="password"
              id="token"
              placeholder={t.tokenPlaceholder}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
            />
            <p className="text-xs text-gray-500 mt-1">{t.tokenHelp}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-2">
                {t.channelPattern}
              </label>
              <input
                type="text"
                id="pattern"
                placeholder={t.patternPlaceholder}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">{t.patternHelp}</p>
            </div>

            <div>
              <label htmlFor="matchType" className="block text-sm font-medium text-gray-700 mb-2">
                {t.matchType}
              </label>
              <select
                id="matchType"
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              >
                <option value="prefix">{t.prefix}</option>
                <option value="suffix">{t.suffix}</option>
                <option value="contains">{t.contains}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="filterByUserMembership" className="block text-sm font-medium text-gray-700 mb-2">
              {t.filterByUser}
            </label>
            <input
              type="text"
              id="filterByUserMembership"
              placeholder={t.filterUserPlaceholder}
              value={filterByUserMembership}
              onChange={(e) => setFilterByUserMembership(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
            />
            <p className="text-xs text-gray-500 mt-1">{t.filterUserHelp}</p>
          </div>

          <button
            onClick={fetchChannels}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition duration-200 font-medium"
          >
            {loading ? t.fetchingChannels : t.searchChannels}
          </button>
        </div>

        {showResults && matchedChannels.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{t.results}</h2>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">
                  {t.selectedCount.replace('{count}', selectedChannels.size.toString())}
                </span>
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded transition duration-200"
                >
                  {t.selectAll}
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded transition duration-200"
                >
                  {t.deselectAll}
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 mb-4">
              {matchedChannels.map((channel) => (
                <div
                  key={channel.id}
                  className={`flex items-start p-3 mb-2 bg-white rounded-lg border-l-4 hover:shadow-md transition-shadow ${
                    selectedChannels.has(channel.id)
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={channel.id}
                    checked={selectedChannels.has(channel.id)}
                    onChange={() => toggleChannelSelection(channel.id)}
                    className="mt-1 mr-3 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor={channel.id} className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-800">
                      #{channel.name}
                      {channel.is_member && (
                        <span className="text-green-500 text-sm ml-2">{t.memberIndicator}</span>
                      )}
                    </div>
                    {channel.topic?.value && (
                      <div className="text-xs text-gray-600 mt-1">{channel.topic.value}</div>
                    )}
                  </label>
                </div>
              ))}
            </div>

            {isBotToken && selectedChannels.size > 0 && (
              <div className="mb-4 transition-all duration-300">
                <label htmlFor="filterUserId" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.userIdToInvite}
                </label>
                <input
                  type="text"
                  id="filterUserId"
                  placeholder={t.userIdPlaceholder}
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">{t.userIdHelp}</p>
              </div>
            )}

            <button
              onClick={joinSelectedChannels}
              disabled={loading || selectedChannels.size === 0}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition duration-200 font-medium"
            >
              {loading ? t.joiningChannels : t.joinSelectedChannels}
            </button>
          </div>
        )}

        {joinResults.length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">
                {t.completedJoin
                  .replace('{joined}', stats.joined.toString())
                  .replace('{failed}', stats.failed.toString())}
              </h3>
              {stats.total > 0 && (
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">✅ {stats.joined}</span>
                  <span className="text-red-600">❌ {stats.failed}</span>
                </div>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {joinResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm py-1 ${
                    result.includes('✅') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}