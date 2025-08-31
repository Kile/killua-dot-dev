import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setIsLoggingIn } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasProcessedAuth = useRef(false);

  useEffect(() => {
    // Prevent multiple executions - check both ref and localStorage
    if (hasProcessedAuth.current || localStorage.getItem('auth_processing') === 'true') {
      return;
    }
    
    // Mark as processing in both ref and localStorage
    hasProcessedAuth.current = true;
    localStorage.setItem('auth_processing', 'true');
    
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage('Authentication was cancelled or failed');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('No authorization code received');
          setTimeout(() => navigate('/'), 2000);
          return;
        }
        
        // Exchange code for token
        const response = await fetch(`/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        
        if (response.ok) {
          const { token, user } = await response.json();
          
          // Store JWT token and user data (Discord token stored server-side)
          localStorage.setItem('discord_token', token);
          localStorage.setItem('discord_user', JSON.stringify(user));
          
          // Set success status FIRST to prevent any error states
          setStatus('success');
          
          // Small delay to show success message, then set user state and redirect
          setTimeout(() => {
            setUser(user);
            setIsLoggingIn(false);
            localStorage.removeItem('auth_processing'); // Clean up processing flag
            navigate('/');
          }, 500);
        } else {
          let errorText = 'Failed to authenticate with Discord';
          try {
            const errorData = await response.json();
            errorText = errorData.error || errorData.message || errorText;
          } catch (_) { /* ignore parse errors */ }
          setStatus('error');
          setErrorMessage(errorText);
          localStorage.removeItem('auth_processing'); // Clean up processing flag
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
        localStorage.removeItem('auth_processing'); // Clean up processing flag
        setTimeout(() => navigate('/'), 2000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-discord-darker flex items-center justify-center">
      <div className="bg-discord-dark p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-discord-blurple animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
            <p className="text-gray-400">Please wait while we complete your Discord login</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Login Successful!</h2>
            <p className="text-gray-400">Redirecting now...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Login Failed</h2>
            <p className="text-gray-400 mb-4">{errorMessage}</p>
            <p className="text-gray-500 text-sm">Redirecting to homepage...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
