import React, { useState } from 'react';
import { 
  Users, 
  Lock, 
  Target, 
  Settings, 
  HelpCircle, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Timer,
  X,
  Edit,
  Save
} from 'lucide-react';
import { updateUserSettings } from '../services/userSettingsService';
import { updateAdminUserSettings } from '../services/adminService';
import type { ActionSettings, UserEditPayload } from '../types/userSettings';
import ToggleSwitch from './ToggleSwitch';

interface UserStatsGridProps {
  userInfo: any;
  onSettingsUpdate?: () => void;
  isAdmin?: boolean;
  targetUserId?: string;
}

const UserStatsGrid: React.FC<UserStatsGridProps> = ({ userInfo, onSettingsUpdate, isAdmin = false, targetUserId }) => {
  const [showInstallInfo, setShowInstallInfo] = useState(false);
  const [showMetUsersInfo, setShowMetUsersInfo] = useState(false);
  const [showActionSettingsInfo, setShowActionSettingsInfo] = useState(false);
  
  // Action Settings edit state
  const [editingActionSettings, setEditingActionSettings] = useState(false);
  const [actionSettings, setActionSettings] = useState<ActionSettings>({
    hug: userInfo?.action_settings?.hug ?? true,
    cuddle: userInfo?.action_settings?.cuddle ?? true,
    pat: userInfo?.action_settings?.pat ?? true,
    slap: userInfo?.action_settings?.slap ?? true,
    poke: userInfo?.action_settings?.poke ?? true,
    tickle: userInfo?.action_settings?.tickle ?? true,
  });
  const [saving, setSaving] = useState(false);

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


  const handleActionSettingChange = (setting: keyof ActionSettings, value: boolean) => {
    setActionSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveActionSettings = async () => {
    const token = localStorage.getItem('discord_token');
    if (!token) return;

    setSaving(true);
    try {
      const payload: UserEditPayload = {
        action_settings: actionSettings,
      };

      if (isAdmin && targetUserId) {
        // Use admin endpoint for editing other users
        await updateAdminUserSettings(token, targetUserId, payload);
      } else {
        // Use regular endpoint for editing own settings
        await updateUserSettings(token, payload);
      }
      
      setEditingActionSettings(false);
      
      // Call the callback to refresh user info
      if (onSettingsUpdate) {
        onSettingsUpdate();
      }
    } catch (error) {
      console.error('Failed to save action settings:', error);
    } finally {
      setSaving(false);
    }
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
                  } catch {
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
                    } catch {
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-discord-blurple" />
            Action Settings
            <button
              onClick={() => setShowActionSettingsInfo(!showActionSettingsInfo)}
              className="ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </h3>
          {!editingActionSettings && (
            <button
              onClick={() => setEditingActionSettings(true)}
              className="flex items-center gap-1 text-discord-blurple hover:text-blue-400 text-sm transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="flex flex-col justify-center flex-1">
          {editingActionSettings ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Configure which actions can be used on you.</p>
              <div className="space-y-3">
                {Object.entries(actionSettings).map(([key, value]) => (
                  <ToggleSwitch
                    key={key}
                    checked={value}
                    onChange={(checked) => handleActionSettingChange(key as keyof ActionSettings, checked)}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    size="sm"
                    color="blue"
                  />
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveActionSettings}
                  disabled={saving}
                  className="flex items-center gap-2 bg-discord-blurple hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Save
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditingActionSettings(false)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(actionSettings).map(([action, enabled]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{action}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    enabled
                      ? 'border-green-400 bg-green-400' 
                      : 'border-gray-500 bg-transparent'
                  }`}>
                    {Boolean(enabled) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action Settings Info */}
        {showActionSettingsInfo && (
          <div className="mt-4 p-3 bg-discord-dark rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300">
              This shows which actions can be used on you. Control which interactions are allowed.
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
