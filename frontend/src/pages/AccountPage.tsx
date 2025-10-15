import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserInfo } from '../services/userInfoService';
import type { UserInfoResponse } from '../services/userInfoService';
import UserAccountView from '../components/UserAccountView';

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // UserInfo data is passed directly to UserAccountView component
    } catch (err) {
      console.error('Error loading user info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Prepare user data for UserAccountView
  const userDataForView = userInfo ? {
    ...userInfo,
    // Add user data that's not in userInfo but needed for display
    id: user.discordId,
    username: user.username,
    avatar: user.avatar,
    banner: user.banner,
  } : null;

  return (
    <UserAccountView 
      userInfo={userDataForView}
      isAdmin={false}
      onSettingsUpdate={loadUserInfo}
    />
  );
};

export default AccountPage;
