import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Shield, Target, Users, Award } from 'lucide-react';
import { fetchUserInfo } from '../services/userInfoService';
import type { UserInfoResponse } from '../services/userInfoService';
import BadgeIcon from '../components/BadgeIcon';
import UserInfoHeader from '../components/UserInfoHeader';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StyledSelect from '../components/StyledSelect';

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameStat, setSelectedGameStat] = useState('rps_pvp');
  const [selectedActionStat, setSelectedActionStat] = useState('hug');

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get the JWT token from localStorage
        const jwtToken = localStorage.getItem('discord_token');
        if (!jwtToken) {
          throw new Error('No authentication token found');
        }
        
        // Fetch user info from our backend (which securely fetches from external API)
        const userData = await fetchUserInfo(jwtToken);
        setUserInfo(userData);
      } catch (err) {
        console.error('Error loading user info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user info');
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
          <p className="text-gray-400">Please log in to view your account details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-blurple mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Data</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const gameStatsData = userInfo ? (() => {
    switch (selectedGameStat) {
      case 'rps_pvp':
        return userInfo.rps_stats?.pvp ? [
          { name: 'Won', value: userInfo.rps_stats.pvp.won, fill: '#10B981' },
          { name: 'Lost', value: userInfo.rps_stats.pvp.lost, fill: '#EF4444' },
          { name: 'Tied', value: userInfo.rps_stats.pvp.tied, fill: '#F59E0B' },
        ] : [];
      case 'rps_pve':
        return userInfo.rps_stats?.pve ? [
          { name: 'Won', value: userInfo.rps_stats.pve.won, fill: '#10B981' },
          { name: 'Lost', value: userInfo.rps_stats.pve.lost, fill: '#EF4444' },
          { name: 'Tied', value: userInfo.rps_stats.pve.tied, fill: '#F59E0B' },
        ] : [];
      case 'trivia_easy':
        return userInfo.trivia_stats?.easy ? [
          { name: 'Correct', value: userInfo.trivia_stats.easy.right || 0, fill: '#10B981' },
          { name: 'Incorrect', value: userInfo.trivia_stats.easy.wrong || 0, fill: '#EF4444' },
        ] : [];
      case 'trivia_medium':
        return userInfo.trivia_stats?.medium ? [
          { name: 'Correct', value: userInfo.trivia_stats.medium.right || 0, fill: '#10B981' },
          { name: 'Incorrect', value: userInfo.trivia_stats.medium.wrong || 0, fill: '#EF4444' },
        ] : [];
      case 'trivia_hard':
        return userInfo.trivia_stats?.hard ? [
          { name: 'Correct', value: userInfo.trivia_stats.hard.right || 0, fill: '#10B981' },
          { name: 'Incorrect', value: userInfo.trivia_stats.hard.wrong || 0, fill: '#EF4444' },
        ] : [];
      default:
        return [];
    }
  })() : [];

  const actionStatsData = userInfo && userInfo.action_stats ? (() => {
    const actionData = userInfo.action_stats[selectedActionStat];
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
          <UserInfoHeader
            avatarUrl={userInfo?.avatar_url || `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
            displayName={userInfo?.display_name || user.username}
            discordId={user.discordId}
            jenny={userInfo?.jenny}
            votes={userInfo?.votes}
          />

          {/* Badges Section */}
          {userInfo && userInfo.badges && userInfo.badges.length > 0 && (
            <div className="mb-8 bg-discord-darker rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-discord-blurple" />
                Badges
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userInfo.badges.map((badge: string, index: number) => (
                  <BadgeIcon key={index} badgeName={badge} />
                ))}
              </div>
            </div>
          )}

          {/* Stats Charts */}
          {userInfo && (
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Game Stats */}
              <div className="bg-discord-darker rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-discord-blurple" />
                  Game Statistics
                </h3>
                <div className="mb-4">
                  <StyledSelect 
                    onChange={(e) => setSelectedGameStat(e.target.value)}
                    value={selectedGameStat}
                  >
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

              {/* Action Stats */}
              <div className="bg-discord-darker rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-discord-blurple" />
                  Action Statistics
                </h3>
                <div className="mb-4">
                  <StyledSelect 
                    onChange={(e) => setSelectedActionStat(e.target.value)}
                    value={selectedActionStat}
                  >
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
          )}



          {/* Account Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-discord-darker rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-discord-blurple" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Username</label>
                  <p className="text-white font-medium">{user.username}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Discord ID</label>
                  <p className="text-white font-mono text-sm">{user.discordId}</p>
                </div>
                {userInfo && (
                  <div>
                    <label className="text-gray-400 text-sm">Locale</label>
                    <p className="text-white font-medium">{userInfo.locale}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-discord-darker rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-discord-blurple" />
                Contact Information
              </h2>
              <div className="space-y-4">
                {user.email ? (
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">
                        {user.email.substring(0, 3)}***{user.email.substring(user.email.indexOf('@'))}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-gray-500 italic">Not provided</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-discord-darker rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-discord-blurple" />
                Account Details
              </h2>
              <div className="space-y-4">
                {user.createdAt && (
                  <div>
                    <label className="text-gray-400 text-sm">Member Since</label>
                    <p className="text-white font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {user.lastLogin && (
                  <div>
                    <label className="text-gray-400 text-sm">Last Login</label>
                    <p className="text-white font-medium">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-discord-darker rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-discord-blurple" />
                Premium Status
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Premium User</label>
                  <p className={`font-medium ${userInfo?.is_premium ? 'text-green-400' : 'text-gray-400'}`}>
                    {userInfo?.is_premium ? 'Yes' : 'No'}
                  </p>
                </div>
                {userInfo?.premium_tier && (
                  <div>
                    <label className="text-gray-400 text-sm">Premium Tier</label>
                    <p className="text-white font-medium">{userInfo.premium_tier}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Avatar URL Info removed per request */}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
