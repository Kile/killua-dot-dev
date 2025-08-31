import React from 'react';
import { Trophy, Users } from 'lucide-react';

interface UserInfoHeaderProps {
  avatarUrl: string;
  displayName: string;
  discordId: string | number;
  jenny?: number;
  votes?: number;
}

const UserInfoHeader: React.FC<UserInfoHeaderProps> = ({
  avatarUrl,
  displayName,
  discordId,
  jenny,
  votes,
}) => {
  return (
    <div className="flex items-center space-x-6 mb-8">
      <div className="relative">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-24 h-24 rounded-full border-4 border-discord-blurple"
        />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
        <p className="text-gray-400 text-lg">Discord ID: {discordId}</p>
        {(typeof jenny === 'number' || typeof votes === 'number') && (
          <div className="flex items-center space-x-4 mt-2">
            {typeof jenny === 'number' && (
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">{jenny.toLocaleString()} Jenny</span>
              </div>
            )}
            {typeof votes === 'number' && (
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">{votes} Bot Votes</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfoHeader;
