import React, { useState, useEffect } from 'react';
import { Trophy, Users } from 'lucide-react';
import { extractDominantColor } from '../utils/colorExtractor';

interface UserInfoHeaderProps {
  avatarUrl: string;
  displayName: string;
  discordId: string | number;
  bannerUrl?: string;
  userBanner?: string;
  jenny?: number;
  votes?: number;
}

const UserInfoHeader: React.FC<UserInfoHeaderProps> = ({
  avatarUrl,
  displayName,
  discordId,
  bannerUrl,
  userBanner,
  jenny,
  votes,
}) => {
  const [dominantColor, setDominantColor] = useState('#5865F2'); // Default Discord blurple

  useEffect(() => {
    if (!bannerUrl && !userBanner) {
      // Only extract color if there's no banner
      extractDominantColor(avatarUrl)
        .then(color => setDominantColor(color))
        .catch(() => setDominantColor('#5865F2'));
    }
  }, [avatarUrl, bannerUrl, userBanner]);

  return (
    <div className="mb-8">
      {/* Banner with Avatar Overlay */}
      <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden mb-4">
        {(bannerUrl || userBanner) ? (
          <img 
            src={bannerUrl || (userBanner && `https://cdn.discordapp.com/banners/${discordId}/${userBanner}.png?size=600`)} 
            alt="Profile banner" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div 
            className="w-full h-full bg-gradient-to-r from-opacity-80 to-opacity-40"
            style={{
              background: `linear-gradient(135deg, ${dominantColor}80 0%, ${dominantColor}40 100%)`
            }}
          ></div>
        )}
      </div>
      
      {/* Avatar positioned below banner but overlapping */}
      <div className="relative -mt-12 sm:-mt-14 ml-4 sm:ml-6">
        <div className="relative">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-discord-blurple object-cover bg-discord-dark"
          />
        </div>
      </div>
      
      {/* User info below avatar */}
      <div className="mt-4 sm:mt-6 ml-4 sm:ml-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">{displayName}</h1>
          <p className="text-gray-400 text-base sm:text-lg">Discord ID: {discordId}</p>
          {(typeof jenny === 'number' || typeof votes === 'number') && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
              {typeof jenny === 'number' && (
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-white font-medium text-sm sm:text-base">{jenny.toLocaleString()} Jenny</span>
                </div>
              )}
              {typeof votes === 'number' && (
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-white font-medium text-sm sm:text-base">{votes} Bot Votes</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfoHeader;
