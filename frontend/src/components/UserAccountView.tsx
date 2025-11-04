import React, { useState } from 'react';
import { Award, User, Shield, Bell, Mail, Edit, HelpCircle, Save, AlertTriangle, Download } from 'lucide-react';
import BadgeIcon from './BadgeIcon';
import UserInfoHeader from './UserInfoHeader';
import UserStatsGrid from './UserStatsGrid';
import UserStatsCharts from './UserStatsCharts';
import ToggleSwitch from './ToggleSwitch';
import { getPremiumTierInfo } from '../utils/premiumTiers';
import { updateUserSettings } from '../services/userSettingsService';
import { updateAdminUserSettings } from '../services/adminService';
import type { EmailNotifications, UserEditPayload } from '../types/userSettings';

interface UserAccountViewProps {
  userInfo: any;
  isAdmin?: boolean;
  targetUserId?: string;
  onSettingsUpdate?: () => void;
}

const UserAccountView: React.FC<UserAccountViewProps> = ({ 
  userInfo, 
  isAdmin = false, 
  targetUserId,
  onSettingsUpdate 
}) => {
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState<EmailNotifications>({
    news: userInfo?.email_notifications?.news || false,
    updates: userInfo?.email_notifications?.updates || false,
    posts: userInfo?.email_notifications?.posts || false,
  });
  const [votingReminder, setVotingReminder] = useState(userInfo?.voting_reminder || false);

  // Edit mode states
  const [editingVotingReminder, setEditingVotingReminder] = useState(false);
  const [editingEmailNotifications, setEditingEmailNotifications] = useState(false);
  const [showVotingReminderInfo, setShowVotingReminderInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEmailNotificationChange = (setting: keyof EmailNotifications, value: boolean) => {
    setEmailNotifications(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async () => {
    const token = localStorage.getItem('discord_token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in to save settings' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload: UserEditPayload = {
        email_notifications: emailNotifications,
        voting_reminder: votingReminder,
      };

      if (isAdmin && targetUserId) {
        // Use admin endpoint for editing other users
        await updateAdminUserSettings(token, targetUserId, payload);
      } else {
        // Use regular endpoint for editing own settings
        await updateUserSettings(token, payload);
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Exit edit modes after successful save
      setEditingVotingReminder(false);
      setEditingEmailNotifications(false);
      
      // Call the callback to refresh user info
      if (onSettingsUpdate) {
        onSettingsUpdate();
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = () => {
    try {
      // Create a clean copy of user data for download
      // Exclude fields that are not stored but only added for display (username, avatar, banner, avatar_url, banner_url)
      const { display_name, username, avatar, banner, avatar_url, banner_url, ...storedData } = userInfo || {};
      const dataToDownload = {
        ...storedData,
        downloadedAt: new Date().toISOString(),
        note: 'This is your personal data exported from Killua Dashboard'
      };

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(dataToDownload, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `killua-user-data-${userInfo.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Your data has been downloaded successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to download data. Please try again.' 
      });
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No User Data</h1>
          <p className="text-gray-400">User information not available.</p>
        </div>
      </div>
    );
  }

  // Prepare banner URL
  const bannerUrl: string | undefined = (() => {
    const explicit = userInfo?.banner_url as string | undefined;
    if (explicit) return explicit;
    const bannerHash = userInfo?.banner as string | undefined;
    if (bannerHash && userInfo?.id) {
      const ext = bannerHash.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/banners/${userInfo.id}/${bannerHash}.${ext}?size=600`;
    }
    return undefined;
  })();

  return (
    <div className="min-h-screen bg-discord-darker">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-discord-dark rounded-lg shadow-xl p-8">
          {/* Header */}
          <UserInfoHeader
            avatarUrl={userInfo?.avatar_url || `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png`}
            displayName={userInfo?.display_name || 'Unknown User'}
            discordId={userInfo.id}
            bannerUrl={bannerUrl}
            userBanner={userInfo?.banner}
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
          <UserStatsGrid 
            userInfo={userInfo} 
            isAdmin={isAdmin}
            targetUserId={targetUserId}
            onSettingsUpdate={onSettingsUpdate} 
          />

          {/* Stats Charts */}
          <UserStatsCharts userInfo={userInfo} />

          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-900/20 border border-green-700 text-green-300' 
                : 'bg-red-900/20 border border-red-700 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Voting Reminder */}
          <div className="mb-8 bg-discord-darker rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-discord-blurple" />
                Voting Reminder
                <button
                  onClick={() => setShowVotingReminderInfo(!showVotingReminderInfo)}
                  className="ml-2 text-gray-400 hover:text-white transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </h2>
              {!editingVotingReminder && (
                <button
                  onClick={() => setEditingVotingReminder(true)}
                  className="flex items-center gap-1 text-discord-blurple hover:text-blue-400 text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            
            {editingVotingReminder ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Get reminded to vote for Killua on various bot lists.</p>
                <ToggleSwitch
                  checked={votingReminder}
                  onChange={setVotingReminder}
                  label="Enable voting reminders"
                  size="sm"
                  color="blue"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveSettings}
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
                    onClick={() => setEditingVotingReminder(false)}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Voting reminders</span>
                  <span className={`text-sm font-medium ${votingReminder ? 'text-green-400' : 'text-gray-500'}`}>
                    {votingReminder ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                {/* Voting Reminder Info */}
                {showVotingReminderInfo && (
                  <div className="p-3 bg-discord-dark rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-300">
                      This toggles whether you receive DMs reminding you to vote for Killua on Discord bot lists to receive rewards.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Notifications */}
          <div className="mb-8 bg-discord-darker rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Mail className="w-5 h-5 mr-2 text-discord-blurple" />
                Email Notifications
              </h2>
              {!editingEmailNotifications && (
                <button
                  onClick={() => setEditingEmailNotifications(true)}
                  className="flex items-center gap-1 text-discord-blurple hover:text-blue-400 text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            
            {editingEmailNotifications ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Configure which email notifications you want to receive.</p>
                
                {/* Warning */}
                <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-300 text-xs font-medium">Feature Not Yet Functional</p>
                      <p className="text-yellow-200 text-xs mt-1">
                        Email notifications are not yet implemented. Your preferences will be saved but no emails will be sent at this time.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(emailNotifications).map(([key, value]) => (
                    <ToggleSwitch
                      key={key}
                      checked={value}
                      onChange={(checked) => handleEmailNotificationChange(key as keyof EmailNotifications, checked)}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      size="sm"
                      color="blue"
                    />
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveSettings}
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
                    onClick={() => setEditingEmailNotifications(false)}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Warning */}
                <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-300 text-xs font-medium">Feature Not Yet Functional</p>
                      <p className="text-yellow-200 text-xs mt-1">
                        Email notifications are not yet implemented. Your preferences will be saved but no emails will be sent at this time.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(emailNotifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm capitalize">{key}</span>
                      <span className={`text-sm font-medium ${value ? 'text-green-400' : 'text-gray-500'}`}>
                        {value ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-discord-darker rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-discord-blurple" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Display Name</label>
                  <p className="text-white font-medium">{userInfo?.display_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Discord ID</label>
                  <p className="text-white font-mono text-sm">{userInfo?.id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Email</label>
                  <p className="text-white font-medium">{userInfo?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Locale</label>
                  <p className="text-white font-medium">{userInfo?.locale || 'N/A'}</p>
                </div>
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

          {/* Data Download Section - Only show for non-admin users */}
          {!isAdmin && (
            <div className="mt-8 bg-discord-darker rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                    <Download className="w-5 h-5 mr-2 text-discord-blurple" />
                    Data Export
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Download a complete copy of your personal data in JSON format
                  </p>
                </div>
                <button
                  onClick={handleDownloadData}
                  className="flex items-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Request My Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAccountView;
