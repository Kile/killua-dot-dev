export interface DiscordUser {
  discordId: string;
  username: string;
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

export interface AuthContextType {
  user: DiscordUser | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  setUser: (user: DiscordUser | null) => void;
  setIsLoggingIn: (isLoggingIn: boolean) => void;
  loading: boolean;
}
