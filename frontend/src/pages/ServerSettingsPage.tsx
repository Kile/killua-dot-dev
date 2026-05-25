import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchGuildInfo, updateGuildPrefix, createTag, editTag, deleteTag } from '../services/guildService';
import type { DiscordGuild } from '../types/auth';
import type { GuildInfo, GuildTag } from '../types/guild';
import { ArrowLeft, BarChart3, Terminal, Settings, Tag, Search, ChevronDown, ChevronUp, Plus, Trash2, Edit3, UserPlus, X, Check, Users, Hash, SortAsc } from 'lucide-react';
import Loading from '../components/Loading';
import StyledSelect from '../components/StyledSelect';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ServerStats from '../components/ServerStats';
import BadgeIcon from '../components/BadgeIcon';
import PageTitle from '../components/PageTitle';
import { isAbortError, useAsyncEffect } from '../hooks/useAsyncEffect';

interface LocationState {
  guild?: DiscordGuild;
}

type TabType = 'stats' | 'prefix' | 'tags';
type SortOption = 'name' | 'uses' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const ServerSettingsPage: React.FC = () => {
  const { user, getToken, guilds: cachedGuilds, fetchGuilds } = useAuth();
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  const [guild, setGuild] = useState<DiscordGuild | null>(null);
  const [guildInfo, setGuildInfo] = useState<GuildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [prefix, setPrefix] = useState('!');
  const [originalPrefix, setOriginalPrefix] = useState('!');
  const [prefixSaving, setPrefixSaving] = useState(false);
  const [prefixSuccess, setPrefixSuccess] = useState(false);
  
  // Tags state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  
  // Tag editing state
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editingTagContent, setEditingTagContent] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editContentValue, setEditContentValue] = useState('');
  const [transferOwnerValue, setTransferOwnerValue] = useState('');
  const [showTransferModal, setShowTransferModal] = useState<string | null>(null);
  const [tagActionLoading, setTagActionLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  
  // Create tag state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagContent, setNewTagContent] = useState('');
  const [statsDownloadData, setStatsDownloadData] = useState<{
    from: string;
    to: string;
    interval: string;
    data: any[];
  } | null>(null);

  const loadGuildData = async () => {
    if (!user || !serverId) return;

    try {
      setLoading(true);
      setError(null);

      const jwtToken = getToken();
      if (!jwtToken) {
        throw new Error('No authentication token found');
      }

      // Try to get guild from: 1) router state, 2) cached guilds, 3) fetch
      let foundGuild = locationState?.guild;
      
      if (!foundGuild || foundGuild.id !== serverId) {
        // Check cached guilds first
        if (cachedGuilds) {
          foundGuild = cachedGuilds.find(g => g.id === serverId);
        }
        
        // If not found in cache, fetch (this will use cache if valid)
        if (!foundGuild) {
          const userGuilds = await fetchGuilds();
          foundGuild = userGuilds.find(g => g.id === serverId);
        }
      }
      
      if (!foundGuild) {
        throw new Error('Server not found or you don\'t have access to it');
      }
      
      if (!foundGuild.editable) {
        throw new Error('Killua is not in this server. Please invite the bot first.');
      }

      setGuild(foundGuild);

      // Fetch guild info (this is from the external API, not Discord, so no rate limit concern)
      const info = await fetchGuildInfo(jwtToken, serverId);
      setGuildInfo(info);
      setPrefix(info.prefix);
      setOriginalPrefix(info.prefix);
    } catch (err) {
      console.error('Error loading guild:', err);
      setError(err instanceof Error ? err.message : 'Failed to load server');
    } finally {
      setLoading(false);
    }
  };

  useAsyncEffect(async (signal) => {
    if (!user || !serverId) return;

    try {
      setLoading(true);
      setError(null);

      const jwtToken = getToken();
      if (!jwtToken) {
        throw new Error('No authentication token found');
      }

      let foundGuild = locationState?.guild;
      
      if (!foundGuild || foundGuild.id !== serverId) {
        if (cachedGuilds) {
          foundGuild = cachedGuilds.find(g => g.id === serverId);
        }
        
        if (!foundGuild) {
          const userGuilds = await fetchGuilds();
          if (signal.aborted) return;
          foundGuild = userGuilds.find(g => g.id === serverId);
        }
      }
      
      if (!foundGuild) {
        throw new Error('Server not found or you don\'t have access to it');
      }
      
      if (!foundGuild.editable) {
        throw new Error('Killua is not in this server. Please invite the bot first.');
      }

      if (signal.aborted) return;
      setGuild(foundGuild);

      const info = await fetchGuildInfo(jwtToken, serverId, signal);
      if (signal.aborted) return;

      setGuildInfo(info);
      setPrefix(info.prefix);
      setOriginalPrefix(info.prefix);
    } catch (err) {
      if (signal.aborted || isAbortError(err)) return;
      console.error('Error loading guild:', err);
      setError(err instanceof Error ? err.message : 'Failed to load server');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, serverId]);

  const getGuildIconUrl = (guild: DiscordGuild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`;
    }
    return null;
  };

  const getGuildInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleDownloadData = () => {
    const exportTags = (guildInfo?.tags || []).map(tag => ({
      ...tag,
      owner_id: tag.owner?.user_id ?? null,
      owner: undefined,
    }));
    const payload = {
      prefix: guildInfo?.prefix ?? null,
      approximate_member_count: guildInfo?.approximate_member_count ?? null,
      tags: exportTags,
      badges: guildInfo?.badges ?? [],
      commandStats: statsDownloadData ?? null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `server-stats-${serverId}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrefixUpdate = async () => {
    if (!serverId || prefix === originalPrefix) return;
    
    const jwtToken = getToken();
    if (!jwtToken) return;

    setPrefixSaving(true);
    setPrefixSuccess(false);
    try {
      await updateGuildPrefix(jwtToken, serverId, prefix);
      setOriginalPrefix(prefix);
      setPrefixSuccess(true);
      setTimeout(() => setPrefixSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating prefix:', err);
      setTagError(err instanceof Error ? err.message : 'Failed to update prefix');
    } finally {
      setPrefixSaving(false);
    }
  };

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    if (!guildInfo?.tags) return [];
    
    let filtered = guildInfo.tags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.owner.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'uses':
          comparison = a.uses - b.uses;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [guildInfo?.tags, searchQuery, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTags.length / ITEMS_PER_PAGE);
  const paginatedTags = filteredAndSortedTags.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCreateTag = async () => {
    if (!serverId || !newTagName.trim() || !newTagContent.trim()) return;
    
    const jwtToken = getToken();
    if (!jwtToken) return;

    setTagActionLoading(true);
    setTagError(null);
    try {
      await createTag(jwtToken, serverId, { name: newTagName.trim(), content: newTagContent.trim() });
      setShowCreateModal(false);
      setNewTagName('');
      setNewTagContent('');
      await loadGuildData();
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleEditTagName = async (originalName: string) => {
    if (!serverId || !editNameValue.trim() || editNameValue === originalName) {
      setEditingTagName(null);
      return;
    }
    
    const jwtToken = getToken();
    if (!jwtToken) return;

    setTagActionLoading(true);
    setTagError(null);
    try {
      await editTag(jwtToken, serverId, { name: originalName, new_name: editNameValue.trim() });
      setEditingTagName(null);
      await loadGuildData();
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to edit tag name');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleEditTagContent = async (tagName: string) => {
    if (!serverId || !editContentValue.trim()) {
      setEditingTagContent(null);
      return;
    }
    
    const jwtToken = getToken();
    if (!jwtToken) return;

    setTagActionLoading(true);
    setTagError(null);
    try {
      await editTag(jwtToken, serverId, { name: tagName, content: editContentValue.trim() });
      setEditingTagContent(null);
      await loadGuildData();
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to edit tag content');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleTransferOwnership = async (tagName: string) => {
    if (!serverId || !transferOwnerValue.trim()) {
      setShowTransferModal(null);
      return;
    }
    
    const jwtToken = getToken();
    if (!jwtToken) return;

    setTagActionLoading(true);
    setTagError(null);
    try {
      await editTag(jwtToken, serverId, { name: tagName, new_owner: transferOwnerValue.trim() });
      setShowTransferModal(null);
      setTransferOwnerValue('');
      await loadGuildData();
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to transfer ownership');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!serverId) return;
    
    const jwtToken = getToken();
    if (!jwtToken) return;

    if (!confirm(`Are you sure you want to delete the tag "${tagName}"?`)) return;

    setTagActionLoading(true);
    setTagError(null);
    try {
      await deleteTag(jwtToken, serverId, { name: tagName });
      setExpandedTag(null);
      await loadGuildData();
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setTagActionLoading(false);
    }
  };

  const isTagOwner = (tag: GuildTag) => {
    // Compare as strings to handle both string and number IDs
    return user && String(tag.owner.user_id) === String(user.discordId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'prefix', label: 'Prefix', icon: <Terminal className="w-4 h-4" /> },
    { id: 'tags', label: 'Tags', icon: <Tag className="w-4 h-4" /> },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
          <p className="text-gray-400">Please log in to view server settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <Loading size="md" className="mx-auto mb-4" />
          <p className="text-gray-400">Loading server settings...</p>
        </div>
      </div>
    );
  }

  if (error || !guild) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400 mb-4">{error || 'Server not found'}</p>
          <button
            onClick={() => navigate('/servers')}
            className="bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded transition-colors duration-200"
          >
            Back to Servers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darker">
      <PageTitle title={guild?.name || 'Server Settings'} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/servers')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Servers</span>
        </button>

        {/* Server Header */}
        <div className="bg-discord-dark rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
            {/* Server Icon */}
            {getGuildIconUrl(guild) ? (
              <img
                src={getGuildIconUrl(guild)!}
                alt={guild.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-discord-blurple/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-discord-blurple/30 flex items-center justify-center ring-4 ring-discord-blurple/30">
                <span className="text-2xl font-bold text-discord-blurple">
                  {getGuildInitials(guild.name)}
                </span>
              </div>
            )}

            {/* Server Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{guild.name}</h1>
              <div className="flex items-center flex-wrap gap-2 text-gray-400">
                <div className="flex items-center space-x-1">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Server Settings</span>
                </div>
                {guild.owner && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                    Owner
                  </span>
                )}
                {guildInfo?.is_premium && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-discord-blurple/20 text-discord-blurple">
                    Premium
                  </span>
                )}
                {guildInfo?.approximate_member_count !== undefined && guildInfo?.approximate_member_count !== null ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-600/50 text-gray-300">
                    <Users className="w-3 h-3 mr-1" />
                    {guildInfo.approximate_member_count.toLocaleString()} members
                  </span>
                ) : guild?.member_count !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-600/50 text-gray-300">
                    <Users className="w-3 h-3 mr-1" />
                    {guild.member_count.toLocaleString()} members
                  </span>
                )}
              </div>
              {guildInfo?.badges && guildInfo.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {guildInfo.badges.map((badge) => (
                    <BadgeIcon key={badge} badgeName={badge} className="w-4 h-4" />
                  ))}
                </div>
              )}
            </div>
            </div>
            <div className="flex w-full md:w-auto items-start md:items-center justify-start md:justify-end">
              <button
                type="button"
                onClick={handleDownloadData}
                className="w-full md:w-auto bg-discord-blurple hover:bg-discord-blurple/90 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Download Data
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-discord-dark rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-400 hover:text-white hover:bg-discord-darker'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'tags' && guildInfo?.tags && (
                <span className="ml-1 text-xs bg-gray-600 px-1.5 py-0.5 rounded">
                  {guildInfo.tags.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {tagError && (
          <div className="mb-4 p-4 bg-discord-red/20 border border-discord-red/50 rounded-lg flex items-center justify-between">
            <p className="text-discord-red text-sm">{tagError}</p>
            <button onClick={() => setTagError(null)} className="text-discord-red hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-700">
          {activeTab === 'stats' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Server Statistics</h2>
              {serverId && user && (
                <ServerStats
                  jwtToken={getToken() || ''}
                  guildId={serverId}
                  onStatsDataChange={setStatsDownloadData}
                />
              )}
            </div>
          )}

          {activeTab === 'prefix' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Bot Prefix</h2>
              <p className="text-gray-400 mb-6">
                Set a custom prefix for Killua bot commands in this server.
              </p>

              <div className="bg-discord-darker rounded-lg p-4 border border-gray-600">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Command Prefix
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="!"
                    maxLength={10}
                    className="flex-1 max-w-xs bg-discord-dark border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent transition-all duration-200"
                  />
                  <button
                    onClick={handlePrefixUpdate}
                    disabled={prefixSaving || prefix === originalPrefix}
                    className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    {prefixSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : prefixSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save</span>
                    )}
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Example: Using "{prefix}" as prefix, you would type "{prefix}help" to get help.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Server Tags</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-discord-green hover:bg-discord-green/80 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Tag</span>
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    <Search className="w-3 h-3 inline mr-1" />
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tags..."
                      className="w-full pl-10 pr-4 py-2 bg-discord-darker border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      <SortAsc className="w-3 h-3 inline mr-1" />
                      Sort by
                    </label>
                    <StyledSelect
                      value={sortBy}
                      onChange={(value) => setSortBy(value as SortOption)}
                      options={[
                        { value: 'name', label: 'Name' },
                        { value: 'uses', label: 'Uses' },
                        { value: 'created_at', label: 'Date' }
                      ]}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Order</label>
                    <StyledSelect
                      value={sortDirection}
                      onChange={(value) => setSortDirection(value as SortDirection)}
                      options={[
                        { value: 'asc', label: 'Ascending' },
                        { value: 'desc', label: 'Descending' }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Tags List */}
              {paginatedTags.length === 0 ? (
                <div className="bg-discord-darker rounded-lg p-8 text-center border border-gray-600 border-dashed">
                  <Tag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">
                    {searchQuery ? 'No tags found matching your search' : 'No tags yet'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'Try a different search term' : 'Create your first tag to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedTags.map((tag) => (
                    <div
                      key={tag.name}
                      className="bg-discord-darker rounded-lg border border-gray-600 overflow-hidden"
                    >
                      {/* Tag Header */}
                      <button
                        onClick={() => setExpandedTag(expandedTag === tag.name ? null : tag.name)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Hash className="w-4 h-4 text-discord-blurple" />
                          {editingTagName === tag.name ? (
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="bg-discord-dark border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-discord-blurple"
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditTagName(tag.name)}
                                disabled={tagActionLoading}
                                className="text-discord-green hover:text-discord-green/80"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingTagName(null)}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium text-white">{tag.name}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="hidden sm:inline">{tag.uses} uses</span>
                          <span className="hidden sm:inline">{formatDate(tag.created_at)}</span>
                          <div className="flex items-center space-x-2">
                            {tag.owner.avatar_url ? (
                              <img
                                src={tag.owner.avatar_url}
                                alt={tag.owner.display_name}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                                {tag.owner.display_name[0]}
                              </div>
                            )}
                            <span className="hidden sm:inline">{tag.owner.display_name}</span>
                          </div>
                          {expandedTag === tag.name ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedTag === tag.name && (
                        <div className="px-4 pb-4 border-t border-gray-600">
                          {/* Mobile stats */}
                          <div className="sm:hidden flex items-center gap-4 py-3 text-sm text-gray-400">
                            <span>{tag.uses} uses</span>
                            <span>{formatDate(tag.created_at)}</span>
                          </div>

                          {/* Content */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
                            {editingTagContent === tag.name ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editContentValue}
                                  onChange={(e) => setEditContentValue(e.target.value)}
                                  className="w-full bg-discord-dark border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-blurple min-h-[100px]"
                                />
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditTagContent(tag.name)}
                                    disabled={tagActionLoading}
                                    className="bg-discord-green hover:bg-discord-green/80 text-white px-3 py-1.5 rounded text-sm flex items-center space-x-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingTagContent(null)}
                                    className="text-gray-400 hover:text-white px-3 py-1.5"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-discord-dark rounded-lg p-3">
                                <MarkdownRenderer content={tag.content} />
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {isTagOwner(tag) && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingTagName(tag.name);
                                    setEditNameValue(tag.name);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Name</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTagContent(tag.name);
                                    setEditContentValue(tag.content);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Content</span>
                                </button>
                                <button
                                  onClick={() => setShowTransferModal(tag.name)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded text-sm transition-colors"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Transfer</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteTag(tag.name)}
                              disabled={tagActionLoading}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-discord-red hover:bg-discord-red/80 text-white rounded text-sm transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-discord-darker border border-gray-600 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-discord-darker border border-gray-600 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Tag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark rounded-xl p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Tag</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tag Name</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="my-tag"
                  className="w-full bg-discord-darker border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <textarea
                  value={newTagContent}
                  onChange={(e) => setNewTagContent(e.target.value)}
                  placeholder="Tag content..."
                  rows={4}
                  className="w-full bg-discord-darker border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTagName('');
                  setNewTagContent('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                disabled={tagActionLoading || !newTagName.trim() || !newTagContent.trim()}
                className="bg-discord-green hover:bg-discord-green/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {tagActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark rounded-xl p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-4">Transfer Tag Ownership</h3>
            <p className="text-gray-400 mb-4">
              Enter the Discord User ID of the new owner for tag "{showTransferModal}".
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Owner User ID</label>
              <input
                type="text"
                value={transferOwnerValue}
                onChange={(e) => setTransferOwnerValue(e.target.value)}
                placeholder="123456789012345678"
                className="w-full bg-discord-darker border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTransferModal(null);
                  setTransferOwnerValue('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransferOwnership(showTransferModal)}
                disabled={tagActionLoading || !transferOwnerValue.trim()}
                className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {tagActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerSettingsPage;
