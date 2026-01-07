import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { DiscordGuild } from '../types/auth';
import { Server, Lock, Plus, Crown, Shield } from 'lucide-react';

const ServersPage: React.FC = () => {
  const { user, guilds: cachedGuilds, guildsLoading, fetchGuilds } = useAuth();
  const navigate = useNavigate();
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGuilds = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Use cached guilds from context (will fetch if cache is stale)
        const userGuilds = await fetchGuilds();
        setGuilds(userGuilds);
      } catch (err) {
        console.error('Error loading guilds:', err);
        setError(err instanceof Error ? err.message : 'Failed to load servers');
      } finally {
        setLoading(false);
      }
    };

    // If we already have cached guilds, use them immediately
    if (cachedGuilds && !guildsLoading) {
      setGuilds(cachedGuilds);
      setLoading(false);
    } else {
      loadGuilds();
    }
  }, [user, fetchGuilds, cachedGuilds, guildsLoading]);

  const getGuildIconUrl = (guild: DiscordGuild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
    }
    return null;
  };

  const getGuildInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Sort guilds: editable (available) servers first, then unavailable
  const sortedGuilds = useMemo(() => {
    return [...guilds].sort((a, b) => {
      if (a.editable === b.editable) {
        return a.name.localeCompare(b.name);
      }
      return a.editable ? -1 : 1;
    });
  }, [guilds]);

  // Bot invite URL
  const getBotInviteUrl = (guildId: string) => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${guildId}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
          <p className="text-gray-400">Please log in to view your servers.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-blurple mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Servers</h1>
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

  return (
    <div className="min-h-screen bg-discord-darker">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-discord-blurple/20 rounded-2xl mb-4">
            <Server className="w-8 h-8 text-discord-blurple" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Your Servers</h1>
          <p className="text-gray-400 text-lg">
            Select a server to manage its settings
          </p>
        </div>

        {/* Servers Grid */}
        {sortedGuilds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No servers found where you have manage server permissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {sortedGuilds.map((guild) => (
              <div
                key={guild.id}
                className={`h-[180px] ${guild.isPremium ? 'premium-border hover:scale-105 transition-transform duration-200' : ''}`}
              >
                <div
                  className={`group flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 h-full ${
                    guild.isPremium
                      ? 'premium-border-inner border-transparent'
                      : guild.editable
                        ? 'bg-discord-dark/50 hover:bg-discord-dark border-transparent hover:border-discord-blurple/50 hover:scale-105'
                        : 'bg-discord-dark/20 border-gray-700/50'
                  }`}
                >
                {/* Server Icon - clickable if editable */}
                <button
                  onClick={() => guild.editable && navigate(`/servers/${guild.id}`, { state: { guild } })}
                  disabled={!guild.editable}
                  className={`relative mb-3 ${guild.editable ? 'cursor-pointer' : 'cursor-default'}`}
                  title={guild.editable ? `Manage ${guild.name}` : undefined}
                >
                  {getGuildIconUrl(guild) ? (
                    <img
                      src={getGuildIconUrl(guild)!}
                      alt={guild.name}
                      className={`w-16 h-16 rounded-full object-cover ring-2 transition-all duration-200 ${
                        guild.isPremium
                          ? 'ring-yellow-500/50 group-hover:ring-yellow-400'
                          : guild.editable
                            ? 'ring-transparent group-hover:ring-discord-blurple'
                            : 'ring-transparent grayscale'
                      }`}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ring-2 transition-all duration-200 ${
                      guild.isPremium
                        ? 'bg-yellow-500/20 ring-yellow-500/50 group-hover:ring-yellow-400'
                        : guild.editable
                          ? 'bg-discord-blurple/30 ring-transparent group-hover:ring-discord-blurple'
                          : 'bg-gray-600/30 ring-transparent'
                    }`}>
                      <span className={`text-xl font-bold ${
                        guild.isPremium ? 'text-yellow-500' : guild.editable ? 'text-discord-blurple' : 'text-gray-500'
                      }`}>
                        {getGuildInitials(guild.name)}
                      </span>
                    </div>
                  )}
                  {/* Owner crown or Manager shield in top right */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center">
                    {guild.owner ? (
                      <Crown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Shield className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {/* Lock icon for unavailable servers */}
                  {!guild.editable && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <Lock className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                </button>

                {/* Server Name */}
                <span className={`text-sm font-medium text-center line-clamp-2 transition-colors duration-200 flex-1 ${
                  guild.editable
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-500'
                }`}>
                  {guild.name}
                </span>
                
                {/* Invite button placeholder - maintains consistent height */}
                <div className="h-8 flex items-center justify-center mt-1">
                  {!guild.editable && (
                    <a
                      href={getBotInviteUrl(guild.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Invite</span>
                    </a>
                  )}
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServersPage;

