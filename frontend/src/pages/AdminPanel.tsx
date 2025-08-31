import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Shield, Target, Users, Award, Database } from 'lucide-react';
import { checkAdminStatus, fetchAdminUserInfo, type AdminUserInfoResponse } from '../services/adminService';
import BadgeIcon from '../components/BadgeIcon';
import UserInfoHeader from '../components/UserInfoHeader';
import StyledSelect from '../components/StyledSelect';
import Loading from '../components/Loading';
import { 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchDiscordId, setSearchDiscordId] = useState('');
  const [searchedUser, setSearchedUser] = useState<AdminUserInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match AccountPage: unified game/action selects
  const [selectedGameStat, setSelectedGameStat] = useState('rps_pvp');
  const [selectedActionStat, setSelectedActionStat] = useState('hug');

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

  // Prepare chart data (same logic as AccountPage but using searchedUser)
  const gameStatsData = searchedUser ? (() => {
    switch (selectedGameStat) {
      case 'rps_pvp':
        return searchedUser.rps_stats?.pvp ? [
          { name: 'Won', value: searchedUser.rps_stats.pvp.won, fill: '#10B981' },
          { name: 'Lost', value: searchedUser.rps_stats.pvp.lost, fill: '#EF4444' },
          { name: 'Tied', value: searchedUser.rps_stats.pvp.tied, fill: '#F59E0B' },
        ] : [];
      case 'rps_pve':
        return searchedUser.rps_stats?.pve ? [
          { name: 'Won', value: searchedUser.rps_stats.pve.won, fill: '#10B981' },
          { name: 'Lost', value: searchedUser.rps_stats.pve.lost, fill: '#EF4444' },
          { name: 'Tied', value: searchedUser.rps_stats.pve.tied, fill: '#F59E0B' },
        ] : [];
      case 'trivia_easy':
        return searchedUser.trivia_stats?.easy ? [
          { name: 'Correct', value: searchedUser.trivia_stats.easy.right || 0, fill: '#10B981' },
          { name: 'Incorrect', value: searchedUser.trivia_stats.easy.wrong || 0, fill: '#EF4444' },
        ] : [];
      case 'trivia_medium':
        return searchedUser.trivia_stats?.medium ? [
          { name: 'Correct', value: searchedUser.trivia_stats.medium.right || 0, fill: '#10B981' },
          { name: 'Incorrect', value: searchedUser.trivia_stats.medium.wrong || 0, fill: '#EF4444' },
        ] : [];
      case 'trivia_hard':
        return searchedUser.trivia_stats?.hard ? [
          { name: 'Correct', value: searchedUser.trivia_stats.hard.right || 0, fill: '#10B981' },
          { name: 'Incorrect', value: searchedUser.trivia_stats.hard.wrong || 0, fill: '#EF4444' },
        ] : [];
      default:
        return [];
    }
  })() : [];

  const actionStatsData = searchedUser && searchedUser.action_stats ? (() => {
    const actionData = (searchedUser.action_stats as any)[selectedActionStat];
    if (!actionData) return [];
    return [
      { name: 'Used', value: actionData.used || 0, fill: '#3B82F6' },
      { name: 'Targeted', value: actionData.targeted || 0, fill: '#8B5CF6' },
    ];
  })() : [];

  return (
    <div className="min-h-screen bg-discord-darker">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-discord-dark rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Shield className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>

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
              {/* User Header */}
              <UserInfoHeader
                avatarUrl={searchedUser.avatar_url}
                displayName={searchedUser.display_name}
                discordId={searchedUser.id}
                jenny={searchedUser.jenny}
                votes={searchedUser.votes}
              />

              {/* Badges Section */}
              {searchedUser.badges && searchedUser.badges.length > 0 && (
                <div className="mb-8 bg-discord-darker rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-discord-blurple" />
                    Badges
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchedUser.badges.map((badge: string, index: number) => (
                      <BadgeIcon key={index} badgeName={badge} />
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Charts (match AccountPage) */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Game Statistics */}
                <div className="bg-discord-darker rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-discord-blurple" />
                    Game Statistics
                  </h3>
                  <div className="mb-4">
                    <StyledSelect value={selectedGameStat} onChange={(e) => setSelectedGameStat(e.target.value)}>
                      <option value="rps_pvp">Rock Paper Scissors (PVP)</option>
                      <option value="rps_pve">Rock Paper Scissors (PVE)</option>
                      <option value="trivia_easy">Trivia (Easy)</option>
                      <option value="trivia_medium">Trivia (Medium)</option>
                      <option value="trivia_hard">Trivia (Hard)</option>
                    </StyledSelect>
                  </div>
                  {(gameStatsData.length === 0 || gameStatsData.every(d => (d as any).value === 0)) ? (
                    <div className="h-[200px] flex items-center justify-center text-gray-400">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={gameStatsData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {gameStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={(entry as any).fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Action Statistics */}
                <div className="bg-discord-darker rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-discord-blurple" />
                    Action Statistics
                  </h3>
                  <div className="mb-4">
                    <StyledSelect value={selectedActionStat} onChange={(e) => setSelectedActionStat(e.target.value)}>
                      <option value="hug">Hug</option>
                      <option value="pat">Pat</option>
                      <option value="slap">Slap</option>
                      <option value="poke">Poke</option>
                      <option value="tickle">Tickle</option>
                      <option value="cuddle">Cuddle</option>
                    </StyledSelect>
                  </div>
                  {(actionStatsData.length === 0 || actionStatsData.every(d => (d as any).value === 0)) ? (
                    <div className="h-[200px] flex items-center justify-center text-gray-400">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={actionStatsData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {actionStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={(entry as any).fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

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
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
