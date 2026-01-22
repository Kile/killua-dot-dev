export interface DiscordUser {
  discordId: string;
  username: string;
  displayName?: string;
  discriminator: string;
  avatar: string;
  banner?: string;
  email?: string;
  createdAt?: string;
  lastLogin?: string;
  isPremium?: boolean;
  premiumTier?: string;
  premiumExpires?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  editable: boolean;
  isPremium: boolean;
  member_count?: number;
}

export interface AuthContextType {
  user: DiscordUser | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  setUser: (user: DiscordUser | null) => void;
  setIsLoggingIn: (isLoggingIn: boolean) => void;
  loading: boolean;
  getToken: () => string | null;
  // Guilds cache
  guilds: DiscordGuild[] | null;
  guildsLoading: boolean;
  fetchGuilds: () => Promise<DiscordGuild[]>;
  clearGuildsCache: () => void;
}
