import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Shield, Target, Users, Award } from 'lucide-react';
import { fetchUserInfo } from '../services/userInfoService';
import type { UserInfoResponse } from '../services/userInfoService';
import BadgeIcon from '../components/BadgeIcon';
import UserInfoHeader from '../components/UserInfoHeader';
import UserStatsGrid from '../components/UserStatsGrid';
import UserStatsCharts from '../components/UserStatsCharts';
import { getPremiumTierInfo } from '../utils/premiumTiers';

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const bannerUrl: string | undefined = (() => {
    const anyInfo = userInfo as any;
    const explicit = anyInfo?.banner_url as string | undefined;
    if (explicit) return explicit;
    const bannerHash = anyInfo?.banner as string | undefined;
    if (bannerHash && user?.discordId) {
      const ext = bannerHash.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/banners/${user.discordId}/${bannerHash}.${ext}?size=600`;
    }
    return undefined;
  })();



  return (
    <div className="min-h-screen bg-discord-darker">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-discord-dark rounded-lg shadow-xl p-8">
          {/* Header */}
          <UserInfoHeader
            avatarUrl={userInfo?.avatar_url || `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
            displayName={userInfo?.display_name || user.username}
            discordId={user.discordId}
            bannerUrl={bannerUrl}
            userBanner={user.banner}
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
              <div className="flex flex-wrap gap-4">
                {userInfo.badges.map((badge: string, index: number) => (
                  <BadgeIcon key={index} badgeName={badge} />
                ))}
              </div>
            </div>
          )}

          {/* User Stats Grid */}
          {userInfo && <UserStatsGrid userInfo={userInfo} />}

          {/* Stats Charts */}
          {userInfo && <UserStatsCharts userInfo={userInfo} />}



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
                <div>
                  <label className="text-gray-400 text-sm">Locale</label>
                  <p className="text-white font-medium">{userInfo?.locale || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-discord-darker rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-discord-blurple" />
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Email</label>
                  <p className="text-white font-medium">
                    {user.email ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.indexOf('@'))}` : 'N/A'}
                  </p>
                </div>
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
                    <p className="text-white font-medium">
                      {(() => {
                        const tierInfo = getPremiumTierInfo(userInfo.premium_tier);
                        return tierInfo 
                          ? `${tierInfo.name} (ID: ${userInfo.premium_tier})`
                          : userInfo.premium_tier;
                      })()}
                    </p>
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
