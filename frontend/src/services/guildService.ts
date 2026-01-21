import type { DiscordGuild } from '../types/auth';
import type { GuildInfo, TagCreatePayload, TagEditPayload, TagDeletePayload, TagResponse } from '../types/guild';

export const fetchUserGuilds = async (jwtToken: string): Promise<DiscordGuild[]> => {
  const response = await fetch('/api/auth/user/guilds', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user guilds: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const fetchGuildInfo = async (jwtToken: string, guildId: string): Promise<GuildInfo> => {
  const response = await fetch(`/api/guild/${guildId}/info`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guild info: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const updateGuildSettings = async (jwtToken: string, guildId: string, settings: { prefix?: string }): Promise<void> => {
  const response = await fetch(`/api/guild/${guildId}/edit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update guild settings: ${response.status}`);
  }
};

export const createTag = async (jwtToken: string, guildId: string, payload: TagCreatePayload): Promise<TagResponse> => {
  const response = await fetch(`/api/guild/${guildId}/tag/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to create tag');
  }

  return data;
};

export const editTag = async (jwtToken: string, guildId: string, payload: TagEditPayload): Promise<TagResponse> => {
  const response = await fetch(`/api/guild/${guildId}/tag/edit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to edit tag');
  }

  return data;
};

export const deleteTag = async (jwtToken: string, guildId: string, payload: TagDeletePayload): Promise<TagResponse> => {
  const response = await fetch(`/api/guild/${guildId}/tag/delete`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to delete tag');
  }

  return data;
};

// Legacy exports for backwards compatibility
export interface GuildSettings {
  prefix: string;
}

export const fetchGuildSettings = async (jwtToken: string, guildId: string): Promise<GuildSettings> => {
  const guildInfo = await fetchGuildInfo(jwtToken, guildId);
  return {
    prefix: guildInfo.prefix,
  };
};

export const updateGuildPrefix = async (jwtToken: string, guildId: string, prefix: string): Promise<void> => {
  await updateGuildSettings(jwtToken, guildId, { prefix });
};

// Command usage types
export interface CommandUsageItem {
  name: string;
  group: string;
  command_id: number;
  values: Array<[string, number]>; // [ISO date string, count]
}

export type CommandUsageResponse = 
  | { error: string }
  | CommandUsageItem[];

export const fetchCommandUsage = async (
  jwtToken: string,
  guildId: string,
  from: string, // ISO date string
  to: string,   // ISO date string
  interval: string
): Promise<CommandUsageResponse> => {
  const params = new URLSearchParams({
    from: from,
    to: to,
    interval: interval,
  });

  const response = await fetch(`/api/guild/${guildId}/command-usage?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error || `Failed to fetch command usage: ${response.status}` };
  }

  return data;
};
