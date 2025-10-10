import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot, LogOut, ChevronDown, Settings, Shield, Crown } from 'lucide-react';
import { checkAdminStatus } from '../services/adminService';
import { getPremiumTierInfo } from '../utils/premiumTiers';

const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [apiIsPremium, setApiIsPremium] = useState<boolean>(false);
  const [apiPremiumTier, setApiPremiumTier] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>('/brand/logo.svg');
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check admin status when user changes
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(null);
        return;
      }
      
      try {
        const jwtToken = localStorage.getItem('discord_token');
        if (!jwtToken) {
          setIsAdmin(false);
          return;
        }
        
        const adminCheck = await checkAdminStatus(jwtToken);
        setIsAdmin(adminCheck.isAdmin);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Fetch user info from API (not Discord profile)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (!user) {
          setApiIsPremium(false);
          setApiPremiumTier(null);
          setDisplayName(null);
          return;
        }
        const jwtToken = localStorage.getItem('discord_token');
        if (!jwtToken) return;
        const res = await fetch('/api/auth/user/info', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setApiIsPremium(Boolean(data.is_premium));
        setApiPremiumTier(data.premium_tier ?? null);
        setDisplayName(data.display_name ?? null);
      } catch {
        // ignore
      }
    };
    fetchUserInfo();
  }, [user]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/premium', label: 'Premium' },
    { path: '/team', label: 'Team' },
    { path: '/commands', label: 'Commands' },
    { path: '/news', label: 'News' },
    { path: '/disclaimer', label: 'Disclaimer' }
  ];

  return (
    <nav className="bg-discord-dark border-b border-gray-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="Killua"
                className="w-8 h-8 rounded"
                onError={() => setLogoSrc(logoSrc === '/brand/logo.svg' ? '/brand/logo.png' : null)}
              />
            ) : (
              <div className="w-8 h-8 bg-discord-blurple rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-white">Killua</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'bg-discord-blurple text-white'
                    : 'text-gray-300 hover:text-white hover:bg-discord-darker'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded hover:bg-discord-darker text-gray-300"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 bg-discord-darker px-3 py-2 rounded-lg hover:bg-discord-dark transition-colors duration-200"
                  >
                    <div className="relative">
                      <img
                        src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
                        alt={user.username}
                        className={`w-6 h-6 rounded-full ${apiIsPremium ? 'ring-2 ring-yellow-400' : ''}`}
                      />
                      {apiIsPremium && (
                        <div className="absolute -top-1 -right-1">
                          <Crown className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-white font-medium hidden sm:block">
                      {displayName || user.username}
                    </span>
                    {apiIsPremium && apiPremiumTier && (
                      <span className="text-xs text-yellow-400 hidden sm:block">
                        {getPremiumTierInfo(apiPremiumTier)?.name}
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-discord-dark border border-gray-600 rounded-lg shadow-xl z-50">
                      <div className="py-2">
                        <Link
                          to="/account"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-discord-darker transition-colors duration-200"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Account</span>
                        </Link>
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-600 my-1"></div>
                            <Link
                              to="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-discord-darker transition-colors duration-200"
                            >
                              <Shield className="h-4 w-4" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </>
                        )}
                        <div className="border-t border-gray-600 my-1"></div>
                        <button
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-discord-darker transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={login}
                  className="bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <img src="/brand/discord-logo.png" alt="Discord" className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation (collapsible) */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-700 px-4 pb-3">
            <div className="pt-2 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-discord-blurple text-white'
                      : 'text-gray-300 hover:text-white hover:bg-discord-darker'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
