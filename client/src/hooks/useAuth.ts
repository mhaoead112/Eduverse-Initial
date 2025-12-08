import { useState, useEffect } from 'react';
import type { User } from '@shared/schema';
import { apiEndpoint } from '@/lib/config';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface LoginData {
  username: string;
  email?: string;
  password: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on component mount
    // Support both old and new token keys
    const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('eduverse_token');
    const storedUser = localStorage.getItem('user') || localStorage.getItem('eduverse_user');
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true
        });
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('eduverse_token');
        localStorage.removeItem('user');
        localStorage.removeItem('eduverse_user');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false
        });
      }
    }
    
    // Listen for storage changes (profile updates)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('eduverse_user');
      if (updatedUser) {
        try {
          const user = JSON.parse(updatedUser);
          setAuthState(prev => ({
            ...prev,
            user
          }));
        } catch (error) {
          console.error('Failed to parse updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Mark loading as complete
    setIsLoading(false);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(apiEndpoint('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Login failed' };
      }

      const { token, user } = await response.json();
      
      // Store auth data
      localStorage.setItem('eduverse_token', token);
      localStorage.setItem('eduverse_user', JSON.stringify(user));
      
      setAuthState({
        user,
        token,
        isAuthenticated: true
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  };

  const logout = () => {
    // Clear both old and new token keys
    localStorage.removeItem('auth_token');
    localStorage.removeItem('eduverse_token');
    localStorage.removeItem('user');
    localStorage.removeItem('eduverse_user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false
    });
    
    // Optional: Call logout API endpoint
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {
      // Ignore errors during logout API call
    });
  };

  const getAuthHeaders = (): HeadersInit => {
    if (authState.token) {
      return {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  };

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    login,
    logout,
    getAuthHeaders
  };
}
