import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { DiscordUser, AuthContextType } from '../types/auth';
import { useLocation } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const hasCheckedSession = useRef(false);
  const isCheckingSession = useRef(false);
  const location = useLocation();

  const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/auth/callback`;

  useEffect(() => {
    // Skip session check if we're on the auth callback page OR if we're in the middle of logging in
    if (location.pathname === '/auth/callback' || isLoggingIn) {
      setLoading(false);
      return;
    }

    // Check for existing session in localStorage
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('discord_token');
        const userData = localStorage.getItem('discord_user');
        
        if (token && userData) {
          try {
            // Verify token with backend
            const response = await fetch(`/api/auth/verify`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const verifiedUser = await response.json();
              setUser(verifiedUser);
            } else {
              // Token invalid, clear storage silently
              localStorage.removeItem('discord_token');
              localStorage.removeItem('discord_user');
            }
          } catch (error) {
            console.error('Error verifying token:', error);
            // Clear storage on error silently
            localStorage.removeItem('discord_token');
            localStorage.removeItem('discord_user');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only check session once, and only if we don't already have a user and we're not in the middle of logging in
    if (!hasCheckedSession.current && !user && !isLoggingIn && !isCheckingSession.current) {
      isCheckingSession.current = true;
      const controller = new AbortController();
      checkSession();
      hasCheckedSession.current = true;
      
      // Cleanup function to prevent race conditions
      return () => {
        controller.abort();
        isCheckingSession.current = false;
      };
    } else {
      setLoading(false);
    }
  }, [user, isLoggingIn, location.pathname]);

  const login = () => {
    setIsLoggingIn(true);
    const scope = 'identify email';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_user');
  };

  const getToken = () => {
    return localStorage.getItem('discord_token');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    setUser,
    setIsLoggingIn,
    loading,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
