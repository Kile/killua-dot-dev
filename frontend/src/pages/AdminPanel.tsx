import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, Shield, Database, Folder, FileText, RefreshCw, Server, Tag, Check, Hash, Edit3, Trash2, UserPlus, ChevronDown, ChevronUp, X, Settings, Users } from 'lucide-react';
import { checkAdminStatus, fetchAdminUserInfo, type AdminUserInfoResponse } from '../services/adminService';
import { fetchGuildInfo, updateGuildPrefix, editTag, deleteTag } from '../services/guildService';
import type { GuildInfo } from '../types/guild';
import Loading from '../components/Loading';
import FileManager from '../components/FileManager';
import NewsAdminPanel from '../components/NewsAdminPanel';
import UpdateAdminPanel from '../components/UpdateAdminPanel';
import UserAccountView from '../components/UserAccountView';
import BadgeIcon from '../components/BadgeIcon';
import ServerStats from '../components/ServerStats';
import MarkdownRenderer from '../components/MarkdownRenderer';
import PageTitle from '../components/PageTitle';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchDiscordId, setSearchDiscordId] = useState('');
  const [searchedUser, setSearchedUser] = useState<AdminUserInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchGuildId, setSearchGuildId] = useState('');
  const [searchedGuild, setSearchedGuild] = useState<GuildInfo | null>(null);
  const [guildLoading, setGuildLoading] = useState(false);
  const [guildError, setGuildError] = useState<string | null>(null);
  const [adminPrefixValue, setAdminPrefixValue] = useState('');
  const [adminPrefixSaving, setAdminPrefixSaving] = useState(false);
  const [adminPrefixSuccess, setAdminPrefixSuccess] = useState(false);
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editingTagContent, setEditingTagContent] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editContentValue, setEditContentValue] = useState('');
  const [transferOwnerValue, setTransferOwnerValue] = useState('');
  const [showTransferModal, setShowTransferModal] = useState<string | null>(null);
  const [tagActionLoading, setTagActionLoading] = useState(false);
  const [activeServerTab, setActiveServerTab] = useState<'overview' | 'prefix' | 'tags' | 'stats' | 'raw'>('overview');
  const [tagSearch, setTagSearch] = useState('');
  const [tagSortBy, setTagSortBy] = useState<'name' | 'uses' | 'created_at'>('name');
  const [tagSortDirection, setTagSortDirection] = useState<'asc' | 'desc'>('asc');
  const [tagPage, setTagPage] = useState(1);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  
  // Get initial tab from URL parameter, default to 'search'
  const getInitialTab = (): 'search' | 'servers' | 'files' | 'news' | 'update' => {
    const page = searchParams.get('page');
    if (page === 'news' || page === 'files' || page === 'update' || page === 'servers') {
      return page;
    }
    return 'search';
  };
  
  const [activeTab, setActiveTab] = useState<'search' | 'servers' | 'files' | 'news' | 'update'>(getInitialTab());

  const handleTabChange = (tab: 'search' | 'servers' | 'files' | 'news' | 'update') => {
    setActiveTab(tab);
    // Update URL parameter
    if (tab === 'search') {
      setSearchParams({}); // Remove page parameter for default tab
    } else {
      setSearchParams({ page: tab });
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const jwtToken = localStorage.getItem('discord_token');
        if (!jwtToken) throw new Error('No authentication token found');
        const adminCheck = await checkAdminStatus(jwtToken);
        setIsAdmin(adminCheck.isAdmin);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  const handleSearch = async () => {
    if (!searchDiscordId.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setSearchedUser(null);
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) throw new Error('No authentication token found');
      const userData = await fetchAdminUserInfo(jwtToken, searchDiscordId.trim());
      setSearchedUser(userData);
    } catch (err) {
      console.error('Error searching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to search user');
    } finally {
      setLoading(false);
    }
  };

  const handleGuildSearch = async () => {
    if (!searchGuildId.trim()) return;
    try {
      setGuildLoading(true);
      setGuildError(null);
      setSearchedGuild(null);
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) throw new Error('No authentication token found');
      const guildData = await fetchGuildInfo(jwtToken, searchGuildId.trim());
      setSearchedGuild(guildData);
      setAdminPrefixValue(guildData.prefix);
      setActiveServerTab('overview');
      setTagSearch('');
      setTagPage(1);
      setExpandedTag(null);
    } catch (err) {
      console.error('Error searching server:', err);
      setGuildError(err instanceof Error ? err.message : 'Failed to search server');
    } finally {
      setGuildLoading(false);
    }
  };

  const handleAdminPrefixSave = async () => {
    if (!searchGuildId.trim() || !adminPrefixValue.trim()) return;
    try {
      setAdminPrefixSaving(true);
      setAdminPrefixSuccess(false);
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) throw new Error('No authentication token found');
      await updateGuildPrefix(jwtToken, searchGuildId.trim(), adminPrefixValue.trim());
      setAdminPrefixSuccess(true);
      setTimeout(() => setAdminPrefixSuccess(false), 3000);
      const updated = await fetchGuildInfo(jwtToken, searchGuildId.trim());
      setSearchedGuild(updated);
    } catch (err) {
      console.error('Error updating prefix:', err);
      setGuildError(err instanceof Error ? err.message : 'Failed to update prefix');
    } finally {
      setAdminPrefixSaving(false);
    }
  };

  const getGuildInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const refreshGuildInfo = async () => {
    const jwtToken = localStorage.getItem('discord_token');
    if (!jwtToken || !searchGuildId.trim()) return;
    const updated = await fetchGuildInfo(jwtToken, searchGuildId.trim());
    setSearchedGuild(updated);
  };

  const handleEditTagName = async (originalName: string) => {
    if (!searchGuildId.trim() || !editNameValue.trim() || editNameValue === originalName) {
      setEditingTagName(null);
      return;
    }
    try {
      setTagActionLoading(true);
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) throw new Error('No authentication token found');
      await editTag(jwtToken, searchGuildId.trim(), { name: originalName, new_name: editNameValue.trim() });
      setEditingTagName(null);
      await refreshGuildInfo();
    } catch (err) {
      setGuildError(err instanceof Error ? err.message : 'Failed to edit tag name');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleEditTagContent = async (tagName: string) => {
    if (!searchGuildId.trim() || !editContentValue.trim()) {
      setEditingTagContent(null);
      return;
    }
    try {
      setTagActionLoading(true);
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) throw new Error('No authentication token found');
      await editTag(jwtToken, searchGuildId.trim(), { name: tagName, content: editContentValue.trim() });
      setEditingTagContent(null);
      await refreshGuildInfo();
    } catch (err) {
      setGuildError(err instanceof Error ? err.message : 'Failed to edit tag content');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleTransferOwnership = async (tagName: string) => {
    if (!searchGuildId.trim() || !transferOwnerValue.trim()) {
      setShowTransferModal(null);
      setTransferOwnerValue('');
      return;
    }
    try {
      setTagActionLoading(true);
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) throw new Error('No authentication token found');
      await editTag(jwtToken, searchGuildId.trim(), { name: tagName, new_owner: transferOwnerValue.trim() });
      setShowTransferModal(null);
      setTransferOwnerValue('');
      await refreshGuildInfo();
    } catch (err) {
      setGuildError(err instanceof Error ? err.message : 'Failed to transfer tag ownership');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!searchGuildId.trim()) return;
    try {
      setTagActionLoading(true);
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) throw new Error('No authentication token found');
      await deleteTag(jwtToken, searchGuildId.trim(), { name: tagName });
      setExpandedTag(null);
      await refreshGuildInfo();
    } catch (err) {
      setGuildError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setTagActionLoading(false);
    }
  };

  const sortedFilteredTags = React.useMemo(() => {
    if (!searchedGuild?.tags) return [];
    let tags = searchedGuild.tags.filter(tag =>
      tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
      tag.owner.display_name.toLowerCase().includes(tagSearch.toLowerCase())
    );
    tags.sort((a, b) => {
      let comparison = 0;
      if (tagSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (tagSortBy === 'uses') {
        comparison = a.uses - b.uses;
      } else {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return tagSortDirection === 'asc' ? comparison : -comparison;
    });
    return tags;
  }, [searchedGuild?.tags, tagSearch, tagSortBy, tagSortDirection]);

  const TAGS_PER_PAGE = 10;
  const tagTotalPages = Math.ceil(sortedFilteredTags.length / TAGS_PER_PAGE) || 1;
  const paginatedTags = sortedFilteredTags.slice(
    (tagPage - 1) * TAGS_PER_PAGE,
    tagPage * TAGS_PER_PAGE
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <PageTitle title="Admin Panel" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
          <p className="text-gray-400">Please log in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <Loading size="md" className="mx-auto mb-4" />
          <p className="text-gray-400">Checking admin status...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-discord-darker">
      <PageTitle title="Admin Panel" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-discord-dark rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Shield className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 mb-8 bg-discord-darker rounded-lg p-1">
            <button
              onClick={() => handleTabChange('search')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                activeTab === 'search'
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-discord-dark'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>User Search</span>
            </button>
            <button
              onClick={() => handleTabChange('servers')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                activeTab === 'servers'
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-discord-dark'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Server Search</span>
            </button>
            <button
              onClick={() => handleTabChange('files')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                activeTab === 'files'
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-discord-dark'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Files</span>
            </button>
            <button
              onClick={() => handleTabChange('news')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                activeTab === 'news'
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-discord-dark'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>News</span>
            </button>
            <button
              onClick={() => handleTabChange('update')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                activeTab === 'update'
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-discord-dark'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Update</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'search' ? (
            <>
              {/* Search Section */}
              <div className="bg-discord-darker rounded-lg p-6 mb-8 border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Search className="w-5 h-5 mr-2 text-discord-blurple" />
                  Search User by Discord ID
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={searchDiscordId}
                    onChange={(e) => setSearchDiscordId(e.target.value)}
                    placeholder="Enter Discord ID (e.g., 606162661184372736)"
                    className="flex-1 bg-discord-dark border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchDiscordId.trim()}
                    className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loading size="sm" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span className="whitespace-nowrap">Search</span>
                  </button>
                </div>
                {error && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400">
                    {error}
                  </div>
                )}
              </div>

              {/* User Results */}
              {searchedUser && (
                <>
                  {/* User Account View */}
                  <UserAccountView 
                    userInfo={searchedUser}
                    isAdmin={true}
                    targetUserId={searchedUser.id.toString()}
                    onSettingsUpdate={() => {
                      // Refresh the user info after settings update
                      if (searchDiscordId) {
                        handleSearch();
                      }
                    }}
                  />

                  {/* Raw Data Section */}
                  <div className="bg-discord-darker rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-discord-blurple" />
                      Raw Data
                    </h3>
                    <div className="bg-discord-dark border border-gray-600 rounded p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        {JSON.stringify(searchedUser, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : activeTab === 'servers' ? (
            <>
              <div className="bg-discord-darker rounded-lg p-6 mb-8 border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-discord-blurple" />
                  Search Server by ID
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={searchGuildId}
                    onChange={(e) => setSearchGuildId(e.target.value)}
                    placeholder="Enter Server ID (e.g., 715358111472418908)"
                    className="flex-1 bg-discord-dark border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                    onKeyPress={(e) => e.key === 'Enter' && handleGuildSearch()}
                  />
                  <button
                    onClick={handleGuildSearch}
                    disabled={guildLoading || !searchGuildId.trim()}
                    className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {guildLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span className="whitespace-nowrap">Search</span>
                  </button>
                </div>
                {guildError && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400">
                    {guildError}
                  </div>
                )}
              </div>

              {searchedGuild && (
                <>
                  <div className="bg-discord-darker rounded-lg p-4 mb-8 border border-gray-600">
                    <div className="flex flex-wrap gap-2">
                      {(['overview', 'prefix', 'tags', 'raw'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveServerTab(tab)}
                          className={`px-3 py-1.5 rounded text-sm ${
                            activeServerTab === tab
                              ? 'bg-discord-blurple text-white'
                              : 'bg-discord-dark text-gray-300 hover:text-white'
                          }`}
                        >
                          {tab === 'overview'
                            ? 'Overview'
                            : tab === 'prefix'
                              ? 'Prefix'
                            : tab === 'tags'
                                ? 'Tags'
                                : 'Raw'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeServerTab === 'overview' && (
                    <>
                      <div className="bg-discord-dark rounded-xl p-6 mb-8 border border-gray-700">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            {searchedGuild.icon_url ? (
                              <img
                                src={searchedGuild.icon_url}
                                alt={searchedGuild.name || 'Server'}
                                className="w-20 h-20 rounded-full object-cover ring-4 ring-discord-blurple/30"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-discord-blurple/30 flex items-center justify-center ring-4 ring-discord-blurple/30">
                                <span className="text-2xl font-bold text-discord-blurple">
                                  {getGuildInitials(searchedGuild.name || '??')}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h1 className="text-2xl font-bold text-white mb-1">{searchedGuild.name || searchGuildId}</h1>
                              <div className="flex items-center flex-wrap gap-2 text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Settings className="w-4 h-4" />
                                  <span className="text-sm">Server Overview</span>
                                </div>
                                {searchedGuild.is_premium && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-discord-blurple/20 text-discord-blurple">
                                    Premium
                                  </span>
                                )}
                                {searchedGuild.approximate_member_count !== undefined && searchedGuild.approximate_member_count !== null && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-600/50 text-gray-300">
                                    <Users className="w-3 h-3 mr-1" />
                                    {searchedGuild.approximate_member_count.toLocaleString()} members
                                  </span>
                                )}
                              </div>
                              {searchedGuild.badges?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {searchedGuild.badges.map((badge) => (
                                    <BadgeIcon key={badge} badgeName={badge} className="w-4 h-4" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-discord-darker rounded-lg p-6 mb-8 border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4">Server Statistics</h3>
                        <ServerStats
                          jwtToken={localStorage.getItem('discord_token') || ''}
                          guildId={searchGuildId.trim()}
                        />
                      </div>
                    </>
                  )}

                  {activeServerTab === 'prefix' && (
                    <div className="bg-discord-darker rounded-lg p-6 mb-8 border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-4">Bot Prefix</h3>
                      <p className="text-gray-400 mb-6">
                        Set a custom prefix for Killua bot commands in this server.
                      </p>
                      <div className="bg-discord-darker rounded-lg p-4 border border-gray-600">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Command Prefix
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={adminPrefixValue}
                            onChange={(e) => setAdminPrefixValue(e.target.value)}
                            placeholder="!"
                            maxLength={10}
                            className="flex-1 w-full sm:max-w-xs bg-discord-dark border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={handleAdminPrefixSave}
                            disabled={adminPrefixSaving || adminPrefixValue.trim() === searchedGuild.prefix}
                            className="w-full sm:w-auto bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            {adminPrefixSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Saving...</span>
                              </>
                            ) : adminPrefixSuccess ? (
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
                          Example: Using "{adminPrefixValue || '!'}" as prefix, you would type "{adminPrefixValue || '!'}help" to get help.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeServerTab === 'tags' && (
                    <div className="bg-discord-darker rounded-lg p-6 mb-8 border border-gray-600">
                      <div className="flex items-center gap-2 mb-4">
                        <Tag className="w-5 h-5 text-discord-blurple" />
                        <h3 className="text-lg font-semibold text-white">Tags</h3>
                      </div>

                      {/* Search and Sort */}
                      <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Search</label>
                          <input
                            type="text"
                            value={tagSearch}
                            onChange={(e) => {
                              setTagSearch(e.target.value);
                              setTagPage(1);
                            }}
                            placeholder="Search tags..."
                            className="w-full bg-discord-dark border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Sort By</label>
                            <select
                              value={tagSortBy}
                              onChange={(e) => setTagSortBy(e.target.value as 'name' | 'uses' | 'created_at')}
                              className="w-full bg-discord-dark border border-gray-600 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="name">Name</option>
                              <option value="uses">Uses</option>
                              <option value="created_at">Date</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Order</label>
                            <select
                              value={tagSortDirection}
                              onChange={(e) => setTagSortDirection(e.target.value as 'asc' | 'desc')}
                              className="w-full bg-discord-dark border border-gray-600 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Tags List */}
                      {paginatedTags.length === 0 ? (
                        <div className="bg-discord-darker rounded-lg p-8 text-center border border-gray-600 border-dashed">
                          <Tag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg mb-2">
                            {tagSearch ? 'No tags found matching your search' : 'No tags yet'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {tagSearch ? 'Try a different search term' : 'Create your first tag to get started'}
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
                      {tagTotalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-6">
                          <button
                            onClick={() => setTagPage(p => Math.max(1, p - 1))}
                            disabled={tagPage === 1}
                            className="px-3 py-1.5 bg-discord-darker border border-gray-600 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <span className="text-gray-400">
                            Page {tagPage} of {tagTotalPages}
                          </span>
                          <button
                            onClick={() => setTagPage(p => Math.min(tagTotalPages, p + 1))}
                            disabled={tagPage === tagTotalPages}
                            className="px-3 py-1.5 bg-discord-darker border border-gray-600 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeServerTab === 'raw' && (
                    <div className="bg-discord-darker rounded-lg p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Database className="w-5 h-5 mr-2 text-discord-blurple" />
                        Raw Data
                      </h3>
                      <div className="bg-discord-dark border border-gray-600 rounded p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
                          {JSON.stringify(searchedGuild, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : activeTab === 'files' ? (
            <FileManager token={localStorage.getItem('discord_token') || ''} />
          ) : activeTab === 'news' ? (
            <NewsAdminPanel />
          ) : (
            <UpdateAdminPanel />
          )}
        </div>
      </div>
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-dark rounded-lg p-6 w-full max-w-md border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-4">Transfer Tag Ownership</h3>
            <p className="text-gray-400 mb-4">
              Enter the Discord User ID of the new owner for tag "{showTransferModal}".
            </p>
            <input
              type="text"
              value={transferOwnerValue}
              onChange={(e) => setTransferOwnerValue(e.target.value)}
              placeholder="Discord User ID"
              className="w-full bg-discord-darker border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-500 mb-6"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTransferModal(null);
                  setTransferOwnerValue('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransferOwnership(showTransferModal)}
                disabled={tagActionLoading || !transferOwnerValue.trim()}
                className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
              >
                <span>Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
