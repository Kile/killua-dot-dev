import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Lock, 
  Target, 
  Settings, 
  HelpCircle, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Timer,
  X
} from 'lucide-react';

interface UserStatsGridProps {
  userInfo: any;
}

const UserStatsGrid: React.FC<UserStatsGridProps> = ({ userInfo }) => {
  const [showInstallInfo, setShowInstallInfo] = useState(false);
  const [showMetUsersInfo, setShowMetUsersInfo] = useState(false);
  const [showActionSettingsInfo, setShowActionSettingsInfo] = useState(false);

  const formatTimeRemaining = (dateString: string) => {
    try {
      const now = new Date();
      const targetDate = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(targetDate.getTime())) {
        return "Invalid date";
      }
      
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        return "Ready to claim";
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `Ready in ${days}d ${hours}h`;
      } else if (hours > 0) {
        return `Ready in ${hours}h ${minutes}m`;
      } else {
        return `Ready in ${minutes}m`;
      }
    } catch (error) {
      return "Error calculating time";
    }
  };

  const formatHuntingTime = (dateString: string) => {
    try {
      const now = new Date();
      const huntingStart = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(huntingStart.getTime())) {
        return { text: "Invalid hunting date", maxReached: false };
      }
      
      const diff = now.getTime() - huntingStart.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days > 14) {
        return { text: `Hunting for ${days} days`, maxReached: true };
      }
      return { text: `Hunting for ${days} days`, maxReached: false };
    } catch (error) {
      return { text: "Error calculating hunting time", maxReached: false };
    }
  };

  const getActionSettingsCount = () => {
    if (!userInfo?.action_settings) return 0;
    return Object.values(userInfo.action_settings).filter(Boolean).length;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
      {/* Met Users */}
      <div className="bg-discord-darker rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-discord-blurple" />
          Met Users
          <button
            onClick={() => setShowMetUsersInfo(!showMetUsersInfo)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </h3>
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-3xl font-bold text-white">
            {userInfo?.met_user?.length || 0}
          </p>
          <p className="text-gray-400 text-sm mt-1">users met</p>
        </div>
        
        {/* Met Users Info */}
        {showMetUsersInfo && (
          <div className="mt-4 p-3 bg-discord-dark rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300">
              "Meeting" a user is part of the Greed Island game in the bot. This tracks how many users you have encountered through the game mechanics.
            </p>
          </div>
        )}
      </div>

      {/* Daily Cooldown */}
      <div className="bg-discord-darker rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-discord-blurple" />
          Daily Cooldown
        </h3>
        <div className="flex flex-col items-center justify-center flex-1">
          {userInfo?.daily_cooldown ? (
            <>
              <p className={`text-lg font-medium ${new Date(userInfo.daily_cooldown) <= new Date() ? 'text-green-400' : 'text-yellow-400'}`}>
                {formatTimeRemaining(userInfo.daily_cooldown)}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Last claimed {(() => {
                  try {
                    const date = new Date(userInfo.daily_cooldown);
                    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                  } catch (error) {
                    return 'Invalid date';
                  }
                })()}
              </p>
            </>
          ) : (
            <p className="text-gray-400">No cooldown data</p>
          )}
        </div>
      </div>

      {/* Weekly Cooldown */}
      <div className="bg-discord-darker rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Timer className="w-5 h-5 mr-2 text-discord-blurple" />
          Weekly Cooldown
        </h3>
        <div className="flex flex-col items-center justify-center flex-1">
          {userInfo?.is_premium ? (
            userInfo?.weekly_cooldown ? (
              <>
                <p className={`text-lg font-medium ${new Date(userInfo.weekly_cooldown) <= new Date() ? 'text-green-400' : 'text-yellow-400'}`}>
                  {formatTimeRemaining(userInfo.weekly_cooldown)}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Last claimed {(() => {
                    try {
                      const date = new Date(userInfo.weekly_cooldown);
                      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                    } catch (error) {
                      return 'Invalid date';
                    }
                  })()}
                </p>
              </>
            ) : (
              <p className="text-gray-400">No cooldown data</p>
            )
          ) : (
            <div className="flex flex-col items-center">
              <Lock className="w-8 h-8 text-gray-500 mb-2" />
              <p className="text-gray-400 text-sm">Premium feature</p>
            </div>
          )}
        </div>
      </div>

      {/* Hunting Status */}
      <div className="bg-discord-darker rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-discord-blurple" />
          Hunting Status
        </h3>
        <div className="flex flex-col items-center justify-center flex-1">
          {userInfo?.effects?.hunting ? (
            (() => {
              const hunting = formatHuntingTime(userInfo.effects.hunting);
              return (
                <>
                  <p className={`text-lg font-medium ${hunting.maxReached ? 'text-orange-400' : 'text-blue-400'}`}>
                    {hunting.text}
                  </p>
                  {hunting.maxReached && (
                    <p className="text-orange-400 text-sm mt-1 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Max rewards reached
                    </p>
                  )}
                </>
              );
            })()
          ) : (
            <p className="text-gray-400">Not hunting</p>
          )}
        </div>
      </div>

      {/* Action Settings */}
      <div className="bg-discord-darker rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-discord-blurple" />
          Action Settings
          <button
            onClick={() => setShowActionSettingsInfo(!showActionSettingsInfo)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </h3>
        <div className="flex flex-col justify-center flex-1">
          <div className="space-y-2">
            {userInfo?.action_settings && Object.keys(userInfo.action_settings).length > 0 ? (
              Object.entries(userInfo.action_settings).map(([action, enabled]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{action}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    Boolean(enabled)
                      ? 'border-green-400 bg-green-400' 
                      : 'border-gray-500 bg-transparent'
                  }`}>
                    {Boolean(enabled) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center flex-1">
                <p className="text-gray-400 text-center">All enabled</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Settings Info */}
        {showActionSettingsInfo && (
          <div className="mt-4 p-3 bg-discord-dark rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300">
              This shows which actions can be used on you. You can edit these settings using a bot command to control which interactions are allowed.
            </p>
          </div>
        )}
      </div>

      {/* User Installed */}
      <div className="bg-discord-darker rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-discord-blurple" />
          User Installed
          <button
            onClick={() => setShowInstallInfo(!showInstallInfo)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </h3>
        <div className="flex flex-col items-center justify-center flex-1">
          <div className={`w-12 h-12 rounded-full border-3 flex items-center justify-center ${
            userInfo?.has_user_installed 
              ? 'border-green-400 bg-green-400' 
              : 'border-red-400 bg-transparent'
          }`}>
            {userInfo?.has_user_installed ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : (
              <X className="w-6 h-6 text-red-400" />
            )}
          </div>
          <p className="text-white font-medium text-base mt-3">
            {userInfo?.has_user_installed ? 'Installed' : 'Not installed'}
          </p>
        </div>
        
        {/* Installation Info */}
        {showInstallInfo && (
          <div className="mt-4 p-3 bg-discord-dark rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300">
              Installing bots to your profile enables you to use certain commands anywhere on Discord, 
              not just in servers where the bot is present.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStatsGrid;
