import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, Shield, Database, Folder, FileText } from 'lucide-react';
import { checkAdminStatus, fetchAdminUserInfo, type AdminUserInfoResponse } from '../services/adminService';
import Loading from '../components/Loading';
import FileManager from '../components/FileManager';
import NewsAdminPanel from '../components/NewsAdminPanel';
import UserAccountView from '../components/UserAccountView';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchDiscordId, setSearchDiscordId] = useState('');
  const [searchedUser, setSearchedUser] = useState<AdminUserInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get initial tab from URL parameter, default to 'search'
  const getInitialTab = (): 'search' | 'files' | 'news' => {
    const page = searchParams.get('page');
    if (page === 'news' || page === 'files') {
      return page;
    }
    return 'search';
  };
  
  const [activeTab, setActiveTab] = useState<'search' | 'files' | 'news'>(getInitialTab());

  const handleTabChange = (tab: 'search' | 'files' | 'news') => {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-discord-dark rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Shield className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-discord-darker rounded-lg p-1">
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
          ) : activeTab === 'files' ? (
            <FileManager token={localStorage.getItem('discord_token') || ''} />
          ) : (
            <NewsAdminPanel />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
